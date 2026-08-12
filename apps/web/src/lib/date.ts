import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * As datas trafegam como ISO em meia-noite UTC. Manter tudo em UTC evita o
 * clássico bug de "a transação de dia 01 aparece como dia 30" quando o fuso do
 * navegador está atrás de Greenwich.
 */

/** Date (local, vindo do calendário) -> ISO em meia-noite UTC do mesmo dia. */
export function toUtcIso(date: Date): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString()
}

/** ISO da API -> Date posicionada no mesmo dia no fuso local. */
export function fromUtcIso(iso: string): Date {
  const date = new Date(iso)
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

/** "2025-11-30T00:00:00Z" -> "30/11/25" (formato usado nas listagens do Figma) */
export function formatShortDate(iso: string): string {
  return format(fromUtcIso(iso), 'dd/MM/yy')
}

/** "2025-11-30T00:00:00Z" -> "30/11/2025" */
export function formatLongDate(iso: string): string {
  return format(fromUtcIso(iso), 'dd/MM/yyyy')
}

/** 11, 2025 -> "Novembro / 2025" (rótulo do filtro de período) */
export function formatPeriod(month: number, year: number): string {
  const label = format(new Date(year, month - 1, 1), 'LLLL', { locale: ptBR })
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} / ${year}`
}

export function parseDateInput(value: string): Date | null {
  const parsed = parse(value, 'dd/MM/yyyy', new Date())
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Lista de períodos para o filtro: do mês atual para trás. */
export function recentPeriods(count = 18): { month: number; year: number; label: string }[] {
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return { month, year, label: formatPeriod(month, year) }
  })
}
