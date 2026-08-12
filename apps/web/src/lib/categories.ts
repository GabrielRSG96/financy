import {
  Bike,
  BookOpen,
  Briefcase,
  Car,
  CreditCard,
  FileText,
  Gamepad2,
  Gift,
  HeartPulse,
  Home,
  Leaf,
  PiggyBank,
  ShoppingCart,
  Ticket,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryColor } from '@/graphql/types'

/**
 * Espelha a allow-list do backend (apps/api/src/shared/catalog.ts). O servidor
 * recusa qualquer ícone fora desta lista, então as duas precisam andar juntas.
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

export type CategoryIconName = (typeof CATEGORY_ICONS)[number]

const ICON_MAP: Record<CategoryIconName, LucideIcon> = {
  briefcase: Briefcase,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  leaf: Leaf,
  'shopping-cart': ShoppingCart,
  ticket: Ticket,
  gift: Gift,
  utensils: Utensils,
  bike: Bike,
  home: Home,
  'heart-pulse': HeartPulse,
  'gamepad-2': Gamepad2,
  'book-open': BookOpen,
  car: Car,
  'credit-card': CreditCard,
  'file-text': FileText,
}

/** Ícone correspondente ao nome; cai no Wallet se o backend mandar algo desconhecido. */
export function categoryIcon(name: string): LucideIcon {
  return ICON_MAP[name as CategoryIconName] ?? Wallet
}

interface ColorTokens {
  /** Fundo da tag e do quadrado do ícone (tom 100) */
  soft: string
  /** Texto da tag (tom 700) */
  strong: string
  /** Ícone e swatch do seletor (tom 600) */
  solid: string
}

export const CATEGORY_COLORS: CategoryColor[] = [
  'GREEN',
  'BLUE',
  'PURPLE',
  'PINK',
  'RED',
  'ORANGE',
  'YELLOW',
]

/** Classes fixas (não interpoladas) para que o Tailwind as mantenha no build. */
export const COLOR_TOKENS: Record<CategoryColor, ColorTokens> = {
  GREEN: { soft: 'bg-[#e0fae9]', strong: 'text-[#15803d]', solid: 'text-[#16a34a]' },
  BLUE: { soft: 'bg-[#dbeafe]', strong: 'text-[#1d4ed8]', solid: 'text-[#2563eb]' },
  PURPLE: { soft: 'bg-[#f3e8ff]', strong: 'text-[#7e22ce]', solid: 'text-[#9333ea]' },
  PINK: { soft: 'bg-[#fce7f3]', strong: 'text-[#be185d]', solid: 'text-[#db2777]' },
  RED: { soft: 'bg-[#fee2e2]', strong: 'text-[#b91c1c]', solid: 'text-[#dc2626]' },
  ORANGE: { soft: 'bg-[#ffedd5]', strong: 'text-[#c2410c]', solid: 'text-[#ea580c]' },
  YELLOW: { soft: 'bg-[#f7f3ca]', strong: 'text-[#a16207]', solid: 'text-[#ca8a04]' },
}

/** Cor sólida (hex) usada nos swatches do seletor de cor. */
export const COLOR_SWATCH: Record<CategoryColor, string> = {
  GREEN: '#16a34a',
  BLUE: '#2563eb',
  PURPLE: '#9333ea',
  PINK: '#db2777',
  RED: '#dc2626',
  ORANGE: '#ea580c',
  YELLOW: '#ca8a04',
}
