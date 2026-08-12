import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors disabled:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-white hover:bg-brand-hover disabled:bg-brand/40 disabled:text-white',
        outline:
          'border border-line bg-surface text-ink hover:bg-canvas disabled:text-ink-faint disabled:hover:bg-surface',
        ghost: 'text-ink hover:bg-canvas disabled:text-ink-faint',
        destructive: 'bg-expense text-white hover:bg-expense/90 disabled:bg-expense/40',
      },
      size: {
        md: 'h-11 px-4 text-sm [&_svg]:size-4',
        sm: 'h-9 px-3 text-sm [&_svg]:size-4',
        block: 'h-11 w-full px-4 text-sm [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    )
  },
)
Button.displayName = 'Button'
