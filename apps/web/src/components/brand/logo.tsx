import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Marca do Figma redesenhada em SVG: duas moedas sobrepostas + a palavra
 * FINANCY em letras geométricas. Vetor em vez de imagem para escalar em
 * qualquer tamanho e herdar a cor via `currentColor`.
 */

export function LogoMark({ className }: { className?: string }) {
  const maskId = useId()

  return (
    <svg viewBox="0 0 27 27" fill="none" className={cn('size-7', className)} aria-hidden>
      <mask id={maskId}>
        <rect width="27" height="27" fill="white" />
        {/* Abre a moeda de trás onde a da frente a cobre */}
        <circle cx="9.5" cy="9.5" r="10.2" fill="black" />
      </mask>

      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <circle cx="16.8" cy="16.8" r="7.6" mask={`url(#${maskId})`} />
        <path d="M14.6 19.6 18.4 15.4" mask={`url(#${maskId})`} />
        <circle cx="9.5" cy="9.5" r="7.6" />
        <path d="M8.4 7.4 10.2 6.2v6.4" strokeWidth="2.2" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 86 16" fill="currentColor" className={cn('h-4', className)} aria-hidden>
      {/* F */}
      <path d="M0 0h10v3.4H3.4v3.2h4.8V10H3.4v6H0z" />
      {/* I */}
      <path d="M13 0h3.4v16H13z" />
      {/* N */}
      <path d="M19.5 0h3.4l4.2 9.5V0h3.4v16h-3.4l-4.2-9.5V16h-3.4z" />
      {/* A */}
      <path d="M33.5 16V0h11v16h-3.4v-5.4h-4.2V16zm3.4-8.8h4.2v-3.8h-4.2z" />
      {/* N */}
      <path d="M47.5 0h3.4l4.2 9.5V0h3.4v16h-3.4l-4.2-9.5V16h-3.4z" />
      {/* C */}
      <path d="M72 0v3.4h-5.9l-1.2 1.2v6.8l1.2 1.2H72V16h-7.9L61.5 13.4V2.6L64.1 0z" />
      {/* Y */}
      <path d="M75 0h3.7l1.8 5.6L82.3 0H86l-3.8 10.1V16h-3.4v-5.9z" />
    </svg>
  )
}

interface LogoProps {
  className?: string
  /** Apenas o símbolo, sem a palavra. */
  markOnly?: boolean
}

export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-brand', className)}>
      <LogoMark />
      {!markOnly && <LogoWordmark />}
      <span className="sr-only">Financy</span>
    </span>
  )
}
