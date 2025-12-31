import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import Withdrawal from '@/lib/withdrawal';
import { createPublicClient, createWalletClient, http, keccak256, encodePacked, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { StatusL2Withdrawl, STT_TOKEN_ADDRESS } from '@/lib/contract';

// Define Status Network Sepolia chain properly
const statusNetworkSepolia = defineChain({
  id: 1660990954,
  name: 'Status Network Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://public.sepolia.rpc.status.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://sepolia-explorer.status.network' },
  },
});

// Minimum withdrawal amount
const MIN_WITHDRAWAL_AMOUNT = 0.1;

// 24 hour cooldown in milliseconds
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000;

// Get server private key from environment
const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY as `0x${string}`;

if (!SERVER_PRIVATE_KEY) {
  console.error('⚠️ SERVER_PRIVATE_KEY is not set in environment variables!');
}

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: statusNetworkSepolia,
  transport: http('https://public.sepolia.rpc.status.network'),
});

/**
 * Get user's current nonce from the contract
 */
async function getUserNonce(userAddress: string): Promise<bigint> {
  try {
    const nonce = await publicClient.readContract({
      address: StatusL2Withdrawl.contractAddress as `0x${string}`,
      abi: StatusL2Withdrawl.abi,
      functionName: 'getUserNonce',
      args: [userAddress as `0x${string}`],
    });
    return nonce as bigint;
  } catch (error) {
    console.error('Failed to get user nonce:', error);
    throw new Error('Failed to get user nonce from contract');
  }
}

/**
 * Generate withdrawal signature
 * Signs: keccak256(user, token, amount, nonce, contractAddress)
 */
async function generateWithdrawalSignature(
  userAddress: string,
  tokenAddress: string,
  amountInWei: bigint,
  nonce: bigint,
  contractAddress: string
): Promise<string> {
  try {
    // Create account from private key
    const account = privateKeyToAccount(SERVER_PRIVATE_KEY);

    // Create the message hash (same format as the contract)
    const messageHash = keccak256(
      encodePacked(
        ['address', 'address', 'uint256', 'uint256', 'address'],
        [
          userAddress as `0x${string}`,
          tokenAddress as `0x${string}`,
          amountInWei,
          nonce,
          contractAddress as `0x${string}`,
        ]
      )
    );

    console.log('Signing withdrawal:', {
      userAddress,
      tokenAddress,
      amountInWei: amountInWei.toString(),
      nonce: nonce.toString(),
      contractAddress,
      messageHash,
      signerAddress: account.address,
    });

    // Sign the message hash
    const signature = await account.signMessage({
      message: { raw: messageHash },
    });

    return signature;
  } catch (error) {
    console.error('Failed to generate signature:', error);
    throw new Error('Failed to generate withdrawal signature');
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { walletAddress, amount, fid, username } = await request.json();
    
    console.log('Withdraw API - Received data:', { walletAddress, amount, fid, username });
    
    // Validation: Required fields
    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, amount' },
        { status: 400 }
      );
    }
    
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const withdrawAmount = parseFloat(amount);
    
    // Validation: Valid amount
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }
    
    // Validation: Minimum withdrawal amount
    if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} MCS` },
        { status: 400 }
      );
    }
    
    // Find user by wallet address
    const user = await User.findOne({ 
      walletAddress: normalizedWalletAddress 
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('Withdraw API - User found:', { 
      balance: user.balance, 
      withdrawAmount 
    });
    
    // Validation: Sufficient balance
    if (user.balance < withdrawAmount) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance',
          currentBalance: user.balance,
          requestedAmount: withdrawAmount
        },
        { status: 400 }
      );
    }
    
    // 24-hour cooldown removed - users can withdraw anytime
    
    // Deduct balance immediately (before creating withdrawal request)
    const previousBalance = user.balance;
    user.balance -= withdrawAmount;
    user.totalWithdrawn = (user.totalWithdrawn || 0) + withdrawAmount;
    
    await user.save();
    
    console.log('Withdraw API - Balance deducted:', {
      previousBalance,
      newBalance: user.balance,
      deductedAmount: withdrawAmount
    });
    
    // Create withdrawal request
    const withdrawal = new Withdrawal({
      walletAddress: normalizedWalletAddress,
      amount: withdrawAmount,
      status: 'pending',
      requestedAt: new Date(),
      fid,
      username,
    });
    
    await withdrawal.save();
    
    console.log('Withdraw API - Withdrawal request created:', {
      withdrawalId: withdrawal._id,
      amount: withdrawAmount,
      status: withdrawal.status
    });
    
    // Get user's current nonce from the contract
    let nonce: bigint;
    try {
      nonce = await getUserNonce(normalizedWalletAddress);
      console.log('Withdraw API - User nonce:', nonce.toString());
    } catch (error) {
      console.error('Failed to get nonce:', error);
      // Rollback balance deduction
      user.balance = previousBalance;
      user.totalWithdrawn = (user.totalWithdrawn || 0) - withdrawAmount;
      await user.save();
      await Withdrawal.findByIdAndDelete(withdrawal._id);
      
      return NextResponse.json(
        { error: 'Failed to get nonce from contract. Please try again.' },
        { status: 500 }
      );
    }

    // Generate withdrawal signature
    let signature: string;
    try {
      // Convert amount to wei (18 decimals for STT token)
      const amountInWei = BigInt(Math.floor(withdrawAmount * 1e18));
      
      signature = await generateWithdrawalSignature(
        normalizedWalletAddress,
        STT_TOKEN_ADDRESS,
        amountInWei,
        nonce,
        StatusL2Withdrawl.contractAddress
      );
      
      console.log('Withdraw API - Signature generated:', signature);
    } catch (error) {
      console.error('Failed to generate signature:', error);
      // Rollback balance deduction
      user.balance = previousBalance;
      user.totalWithdrawn = (user.totalWithdrawn || 0) - withdrawAmount;
      await user.save();
      await Withdrawal.findByIdAndDelete(withdrawal._id);
      
      return NextResponse.json(
        { error: 'Failed to generate withdrawal signature. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal._id,
      amount: withdrawAmount,
      newBalance: user.balance,
      status: 'pending',
      message: 'Withdrawal request approved. Please claim your tokens.',
      // Return signature data for claiming
      signature,
      nonce: nonce.toString(),
      tokenAddress: STT_TOKEN_ADDRESS,
      contractAddress: StatusL2Withdrawl.contractAddress,
    });
    
  } catch (error) {
    console.error('Withdraw API - Error:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    );
  }
}

// GET endpoint to check withdrawal history
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress parameter' },
        { status: 400 }
      );
    }
    
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Get all withdrawals for this user
    const withdrawals = await Withdrawal.find({
      walletAddress: normalizedWalletAddress
    }).sort({ requestedAt: -1 }).limit(10);
    
    // No cooldown - users can always withdraw
    let canWithdraw = true;
    let hoursRemaining = 0;
    const recentWithdrawal = await Withdrawal.findOne({
      walletAddress: normalizedWalletAddress,
    }).sort({ requestedAt: -1 });
    
    return NextResponse.json({
      withdrawals,
      canWithdraw,
      hoursRemaining: canWithdraw ? 0 : hoursRemaining,
      lastWithdrawal: recentWithdrawal
    });
    
  } catch (error) {
    console.error('Withdraw API GET - Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal history' },
      { status: 500 }
    );
  }
}

