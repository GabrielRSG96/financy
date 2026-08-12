import { Eye, EyeOff, Lock } from 'lucide-react'
import { forwardRef, useState } from 'react'
import { Input, type InputProps } from '@/components/ui/field'

/** Campo de senha com o olhinho de mostrar/ocultar, como no Figma. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon'>>(
  (props, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        icon={<Lock />}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="text-ink-faint transition-colors hover:text-ink-muted"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        {...props}
      />
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
