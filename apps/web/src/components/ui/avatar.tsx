import { cn } from '@/lib/utils'

interface AvatarProps {
  initials: string
  className?: string
  size?: 'sm' | 'lg'
}

/** Círculo cinza com as iniciais — o avatar do Figma (ex.: "CT"). */
export function Avatar({ initials, className, size = 'sm' }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-[#d1d5db] font-medium text-ink-soft select-none',
        size === 'sm' ? 'size-9 text-xs' : 'size-16 text-lg',
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}
