import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldShellProps {
  label?: string
  helper?: ReactNode
  error?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function FieldShell({ label, helper, error, htmlFor, children, className }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn('block text-sm font-medium', error ? 'text-expense' : 'text-ink')}
        >
          {label}
        </label>
      )}
      {children}
      {(error || helper) && (
        <p className={cn('text-xs', error ? 'text-expense' : 'text-ink-muted')}>{error ?? helper}</p>
      )}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: ReactNode
  error?: string
  icon?: ReactNode
  trailing?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, containerClassName, label, helper, error, icon, trailing, id, ...props },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <FieldShell
        label={label}
        helper={helper}
        error={error}
        htmlFor={inputId}
        className={containerClassName}
      >
        <div
          className={cn(
            'flex h-11 items-center gap-2 rounded-lg border bg-surface px-3 transition-colors',
            'focus-within:border-brand focus-within:ring-1 focus-within:ring-brand',
            error ? 'border-expense focus-within:border-expense focus-within:ring-expense' : 'border-line',
            props.disabled && 'bg-canvas opacity-70',
          )}
        >
          {icon && (
            <span className={cn('shrink-0 [&_svg]:size-4', error ? 'text-expense' : 'text-ink-faint')}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            className={cn(
              'w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint disabled:cursor-not-allowed',
              className,
            )}
            {...props}
          />
          {trailing && <span className="shrink-0">{trailing}</span>}
        </div>
      </FieldShell>
    )
  },
)
Input.displayName = 'Input'
