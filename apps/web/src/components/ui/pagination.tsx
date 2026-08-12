import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Janela de no máximo 5 páginas ao redor da atual — com muitas páginas, listar
 * todas estouraria a linha do rodapé da tabela.
 */
function pageWindow(page: number, totalPages: number, size = 5): number[] {
  const start = Math.max(1, Math.min(page - Math.floor(size / 2), totalPages - size + 1))
  const count = Math.min(size, totalPages)
  return Array.from({ length: count }, (_, index) => start + index)
}

/** Prancha "Pagination Button": quadrados; o ativo fica verde sólido. */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const arrow =
    'inline-flex size-8 items-center justify-center rounded-md border border-line bg-surface text-ink-soft transition-colors hover:bg-canvas disabled:opacity-40 disabled:hover:bg-surface'

  return (
    <nav className={cn('flex items-center gap-1.5', className)} aria-label="Paginação">
      <button
        type="button"
        className={arrow}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pageWindow(page, totalPages).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          aria-current={item === page ? 'page' : undefined}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md border text-sm transition-colors',
            item === page
              ? 'border-brand bg-brand font-medium text-white'
              : 'border-line bg-surface text-ink-soft hover:bg-canvas',
          )}
        >
          {item}
        </button>
      ))}

      <button
        type="button"
        className={arrow}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
