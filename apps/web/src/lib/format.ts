/**
 * Formatação e parsing de dinheiro. O app inteiro trabalha com centavos (Int) —
 * valores monetários nunca passam por float, que arredonda errado.
 */

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 425000 -> "R$ 4.250,00" */
export function formatCurrency(cents: number): string {
  return currency.format(cents / 100)
}

/** 425000 -> "4.250,00" (sem o símbolo, usado no input do formulário) */
export function formatAmount(cents: number): string {
  return decimal.format(cents / 100)
}

/** 425000, 'INCOME' -> "+ R$ 4.250,00" */
export function formatSignedCurrency(cents: number, type: 'INCOME' | 'EXPENSE'): string {
  return `${type === 'INCOME' ? '+' : '-'} ${formatCurrency(cents)}`
}

/**
 * Saldo com sinal explícito: 40000 -> "+ R$ 400,00", -40000 -> "- R$ 400,00".
 * Diferente de `formatSignedCurrency`, o sinal vem do próprio número, e um
 * saldo zerado sai sem sinal nenhum.
 */
export function formatBalance(cents: number): string {
  if (cents === 0) return formatCurrency(0)
  return `${cents > 0 ? '+' : '-'} ${formatCurrency(Math.abs(cents))}`
}

/**
 * Converte o que o usuário digitou em centavos, lendo apenas os dígitos.
 * Digitar "4250" resulta em R$ 42,50 — o comportamento de máquina de calcular
 * que evita ambiguidade entre separador de milhar e de decimal.
 */
export function parseAmountToCents(input: string): number {
  const digits = input.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits.slice(0, 15))
}

/** Formata o que está sendo digitado no input de valor: "4250" -> "42,50" */
export function maskAmount(input: string): string {
  return formatAmount(parseAmountToCents(input))
}
