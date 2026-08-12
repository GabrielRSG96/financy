const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatCurrency(cents: number): string {
  return currency.format(cents / 100)
}

export function formatAmount(cents: number): string {
  return decimal.format(cents / 100)
}

export function formatSignedCurrency(cents: number, type: 'INCOME' | 'EXPENSE'): string {
  return `${type === 'INCOME' ? '+' : '-'} ${formatCurrency(cents)}`
}

export function formatBalance(cents: number): string {
  if (cents === 0) return formatCurrency(0)
  return `${cents > 0 ? '+' : '-'} ${formatCurrency(Math.abs(cents))}`
}

export function parseAmountToCents(input: string): number {
  const digits = input.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits.slice(0, 15))
}

export function maskAmount(input: string): string {
  return formatAmount(parseAmountToCents(input))
}
