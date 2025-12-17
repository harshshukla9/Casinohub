export default function formatAmount(amount: number): string {
  if (amount === 0) return '0'
  if (amount < 0.000001) return amount.toExponential(2)
  if (amount < 1) return amount.toFixed(6)
  if (amount < 1000) return amount.toFixed(2)
  if (amount < 1000000) return (amount / 1000).toFixed(2) + 'K'
  return (amount / 1000000).toFixed(2) + 'M'
}

