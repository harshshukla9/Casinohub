/**
 * Unified game balance management utilities
 * All games use these functions to interact with the user's balance
 */

interface BetResponse {
  success: boolean
  newBalance: number
  betAmount: number
  message?: string
  error?: string
}

interface CashoutResponse {
  success: boolean
  newBalance: number
  winnings: number
  multiplier: number
  message?: string
  error?: string
}

/**
 * Place a bet - deducts amount from user balance
 */
export async function placeBet(
  walletAddress: string,
  betAmount: number
): Promise<BetResponse> {
  try {
    const response = await fetch('/api/bet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        betAmount,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        newBalance: 0,
        betAmount,
        error: data.error || 'Failed to place bet',
      }
    }

    // Dispatch event to update balance across the app
    window.dispatchEvent(new CustomEvent('betPlaced', { detail: data }))
    window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: data }))

    return {
      success: true,
      newBalance: data.newBalance,
      betAmount: data.betAmount,
      message: data.message || 'Bet placed successfully',
    }
  } catch (error) {
    console.error('Error placing bet:', error)
    return {
      success: false,
      newBalance: 0,
      betAmount,
      error: error instanceof Error ? error.message : 'Failed to place bet',
    }
  }
}

/**
 * Cashout - adds winnings to user balance
 */
export async function cashout(
  walletAddress: string,
  betAmount: number,
  multiplier: number
): Promise<CashoutResponse> {
  try {
    const response = await fetch('/api/cashout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        betAmount,
        multiplier,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        newBalance: 0,
        winnings: 0,
        multiplier,
        error: data.error || 'Failed to cashout',
      }
    }

    // Dispatch event to update balance across the app
    console.log('game-balance - Dispatching cashout events, newBalance:', data.newBalance)
    window.dispatchEvent(new CustomEvent('cashoutCompleted', { detail: data }))
    window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: data }))

    return {
      success: true,
      newBalance: data.newBalance,
      winnings: data.winnings,
      multiplier: data.multiplier,
      message: data.message || 'Cashout successful',
    }
  } catch (error) {
    console.error('Error cashing out:', error)
    return {
      success: false,
      newBalance: 0,
      winnings: 0,
      multiplier,
      error: error instanceof Error ? error.message : 'Failed to cashout',
    }
  }
}

/**
 * Check if user has sufficient balance
 */
export function hasSufficientBalance(
  currentBalance: number,
  requiredAmount: number
): boolean {
  return currentBalance >= requiredAmount
}

