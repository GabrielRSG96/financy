import { COLOR_TOKENS } from '@/lib/categories'
import type { CategoryColor } from '@/graphql/types'
import { cn } from '@/lib/utils'

interface TagProps {
  label: string
  color: CategoryColor
  className?: string
}

export function Tag({ label, color, className }: TagProps) {
  const tokens = COLOR_TOKENS[color]

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-full px-2.5 py-1 text-xs font-medium',
        tokens.soft,
        tokens.strong,
        className,
      )}
    >
      {label}
    </span>
  )
}

export function NeutralTag({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted',
        className,
      )}
    >
      {label}
    </span>
  )
}
