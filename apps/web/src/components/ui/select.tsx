import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { FieldShell } from './field'

export const SelectRoot = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { icon?: ReactNode; error?: boolean }
>(({ className, children, icon, error, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-11 w-full items-center gap-2 rounded-lg border bg-surface px-3 text-sm text-ink transition-colors',
      'focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none',
      'data-[placeholder]:text-ink-faint disabled:opacity-60',
      error ? 'border-expense' : 'border-line',
      className,
    )}
    {...props}
  >
    {icon && <span className="shrink-0 text-ink-faint [&_svg]:size-4">{icon}</span>}
    <span className="flex-1 truncate text-left">{children}</span>
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 shrink-0 text-ink-muted" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={4}
      className={cn(
        'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-line bg-surface shadow-lg',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = 'SelectContent'

export const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 pr-8 text-sm text-ink outline-none',
      'focus:bg-canvas data-[state=checked]:font-medium',
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute right-2">
      <Check className="size-4 text-brand" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
))
SelectItem.displayName = 'SelectItem'

interface SelectFieldProps {
  label?: string
  helper?: ReactNode
  error?: string
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  icon?: ReactNode
  disabled?: boolean
  className?: string
  children: ReactNode
}

/** Select completo com label/helper — a variação "Select" da prancha de Input. */
export function SelectField({
  label,
  helper,
  error,
  placeholder,
  value,
  onValueChange,
  icon,
  disabled,
  className,
  children,
}: SelectFieldProps) {
  return (
    <FieldShell label={label} helper={helper} error={error} className={className}>
      <SelectRoot value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger icon={icon} error={Boolean(error)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </SelectRoot>
    </FieldShell>
  )
}
