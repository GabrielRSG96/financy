import { categoryIcon, COLOR_TOKENS } from '@/lib/categories'
import type { CategoryColor } from '@/graphql/types'
import { cn } from '@/lib/utils'

interface CategoryIconProps {
  icon: string
  color: CategoryColor
  size?: 'sm' | 'md'
  className?: string
}

/** Quadradinho colorido com o ícone da categoria, usado nas listas e nos cards. */
export function CategoryIcon({ icon, color, size = 'md', className }: CategoryIconProps) {
  const Icon = categoryIcon(icon)
  const tokens = COLOR_TOKENS[color]

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg',
        size === 'sm' ? 'size-8' : 'size-9',
        tokens.soft,
        tokens.solid,
        className,
      )}
      aria-hidden
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-[18px]'} />
    </span>
  )
}
