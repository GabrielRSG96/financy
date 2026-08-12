/**
 * Catálogo compartilhado entre API e front-end.
 *
 * Os ícones vêm da biblioteca Lucide (mesma indicada no styleguide do Figma) e as
 * cores são os tons 600 do Tailwind amostrados diretamente dos PNGs de referência.
 * Manter a lista fechada evita que o cliente grave um ícone inexistente no banco.
 */

export const CATEGORY_ICONS = [
  'briefcase',
  'wallet',
  'piggy-bank',
  'leaf',
  'shopping-cart',
  'ticket',
  'gift',
  'utensils',
  'bike',
  'home',
  'heart-pulse',
  'gamepad-2',
  'book-open',
  'car',
  'credit-card',
  'file-text',
] as const

export type CategoryIcon = (typeof CATEGORY_ICONS)[number]

export const CATEGORY_COLORS = [
  'GREEN',
  'BLUE',
  'PURPLE',
  'PINK',
  'RED',
  'ORANGE',
  'YELLOW',
] as const

export type CategoryColor = (typeof CATEGORY_COLORS)[number]

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'] as const

export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export function isCategoryIcon(value: string): value is CategoryIcon {
  return (CATEGORY_ICONS as readonly string[]).includes(value)
}
