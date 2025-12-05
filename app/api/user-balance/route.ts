import { connectDB } from "@/lib/db"
import User from "@/lib/user"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return Response.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() })

    if (!user) {
      return Response.json({ 
        user: {
          balance: 0,
          totalDeposited: 0,
          totalWithdrawn: 0
        }
      })
    }

    return Response.json({ user })
  } catch (error) {
    console.error('Error fetching user balance:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
