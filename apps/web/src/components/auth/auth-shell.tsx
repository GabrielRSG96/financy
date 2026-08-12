import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/logo'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

/** Layout compartilhado entre Login e Cadastro: logo acima, card centralizado. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-canvas px-4 py-10">
      <Logo className="[&_svg]:h-5 [&_svg:first-child]:size-8" />

      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        </div>

        {children}

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs text-ink-muted">ou</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {footer}
      </div>
    </div>
  )
}
