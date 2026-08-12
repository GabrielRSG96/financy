import { cn } from '@/lib/utils'

interface AvatarProps {
  initials: string
  src?: string | null
  alt?: string
  className?: string
  size?: 'sm' | 'lg'
}

export function Avatar({ initials, src, alt, className, size = 'sm' }: AvatarProps) {
  const dimensions = size === 'sm' ? 'size-9 text-xs' : 'size-16 text-lg'

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? ''}
        className={cn('shrink-0 rounded-full bg-canvas object-cover', dimensions, className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-[#d1d5db] font-medium text-ink-soft select-none',
        dimensions,
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}
