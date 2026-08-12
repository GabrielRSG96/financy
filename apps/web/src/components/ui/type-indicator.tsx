import { CircleArrowDown, CircleArrowUp } from 'lucide-react'
import type { TransactionType } from '@/graphql/types'
import { cn } from '@/lib/utils'

interface TypeIndicatorProps {
  type: TransactionType
  /** Sem rótulo, exibe apenas o ícone (usado na lista do dashboard). */
  showLabel?: boolean
  className?: string
}

/** Prancha "Type": Entrada (seta para cima, verde) e Saída (para baixo, vermelha). */
export function TypeIndicator({ type, showLabel = true, className }: TypeIndicatorProps) {
  const isIncome = type === 'INCOME'
  const Icon = isIncome ? CircleArrowUp : CircleArrowDown
  const label = isIncome ? 'Entrada' : 'Saída'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium',
        isIncome ? 'text-income' : 'text-expense',
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  )
}
