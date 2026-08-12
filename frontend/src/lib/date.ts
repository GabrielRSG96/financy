import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function toUtcIso(date: Date): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString()
}

export function fromUtcIso(iso: string): Date {
  const date = new Date(iso)
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

export function formatShortDate(iso: string): string {
  return format(fromUtcIso(iso), 'dd/MM/yy')
}

export function formatLongDate(iso: string): string {
  return format(fromUtcIso(iso), 'dd/MM/yyyy')
}

export function formatPeriod(month: number, year: number): string {
  const label = format(new Date(year, month - 1, 1), 'LLLL', { locale: ptBR })
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} / ${year}`
}

export function parseDateInput(value: string): Date | null {
  const parsed = parse(value, 'dd/MM/yyyy', new Date())
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function recentPeriods(count = 18): { month: number; year: number; label: string }[] {
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return { month, year, label: formatPeriod(month, year) }
  })
}
