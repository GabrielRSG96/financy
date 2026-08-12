import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 'danger' pinta o ícone de vermelho, como o botão de deletar do Figma. */
  tone?: 'neutral' | 'danger'
  /** Obrigatório: o botão só tem ícone, então precisa de rótulo acessível. */
  label: string
}

/** Prancha "Icon Button" do styleguide: quadrado, borda sutil, hover cinza. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tone = 'neutral', label, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md border border-line bg-surface transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4',
        tone === 'danger'
          ? 'text-expense hover:bg-expense/10'
          : 'text-ink-soft hover:bg-canvas hover:text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
)
IconButton.displayName = 'IconButton'
