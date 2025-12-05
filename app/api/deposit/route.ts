import { connectDB } from "@/lib/db";
import User from "@/lib/user";

export async function POST(req: Request) {
  try {
    let { fid, username, walletAddress, amount, transactionHash } = await req.json();
    
    console.log('Received deposit request:', { fid, username, walletAddress, amount, transactionHash });
    
    // Validate essential fields
    if (!walletAddress || !amount || !transactionHash) {
      console.log('Missing essential fields:', { 
        walletAddress: !!walletAddress, 
        amount: !!amount, 
        transactionHash: !!transactionHash 
      });
      return Response.json({ error: 'Missing required fields: walletAddress, amount, or transactionHash' }, { status: 400 });
    }

    // Handle web app scenario: if fid/username are missing, use wallet address
    if (!fid || !username) {
      console.log('🌐 Web app detected - using wallet address as fallback');
      fid = fid || walletAddress.toLowerCase();
      username = username || `User-${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      console.log('Generated fallback:', { fid, username });
    }

    // Connect to database
    await connectDB();

    // Parse the deposit amount for database
    const depositAmount = parseFloat(amount);

    // Simple approach: Find user first, then update or create
    console.log('🔍 Searching for user with wallet address:', walletAddress.toLowerCase());
    
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    console.log('👤 User found:', user ? 'YES' : 'NO');
    
    if (user) {
      // User exists - update their balance and transaction hash
      console.log('📝 Updating existing user...');
      console.log('💰 Current balance:', user.balance);
      console.log('💰 Current totalDeposited:', user.totalDeposited);
      console.log('💸 Adding deposit amount:', depositAmount);
      
      user.balance += depositAmount;
      user.totalDeposited += depositAmount;
      user.lastTransactionHash = transactionHash;
      user.username = username; // Update username in case it changed
      
      await user.save();
      console.log('✅ User updated successfully!');
      console.log('💰 New balance:', user.balance);
      console.log('💰 New totalDeposited:', user.totalDeposited);
    } else {
      // User doesn't exist - create new user
      console.log('🆕 Creating new user...');
      console.log('👤 FID:', fid);
      console.log('👤 Username:', username);
      console.log('👤 Wallet:', walletAddress.toLowerCase());
      console.log('💰 Initial balance:', depositAmount);
      
      user = await User.create({
        username,
        walletAddress: walletAddress.toLowerCase(),
        fid,
        balance: depositAmount,
        totalDeposited: depositAmount,
        lastTransactionHash: transactionHash,
      });
      
      console.log('✅ New user created successfully!');
      console.log('👤 User ID:', user._id);
      console.log('💰 Balance:', user.balance);
    }

    return Response.json({ 
      success: true, 
      user,
      transactionHash 
    });

  } catch (error) {
    console.error('Deposit error:', error);
    return Response.json({ 
      error: 'Failed to save deposit to database', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
