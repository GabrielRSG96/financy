import { describe, expect, it } from 'vitest'
import { formatPeriod, formatShortDate, fromUtcIso, recentPeriods, toUtcIso } from './date'

describe('conversão UTC', () => {
  it('grava o dia escolhido na meia-noite UTC', () => {
    expect(toUtcIso(new Date(2025, 10, 30))).toBe('2025-11-30T00:00:00.000Z')
  })

  it('lê de volta o mesmo dia, independentemente do fuso do navegador', () => {
    const date = fromUtcIso('2025-11-30T00:00:00.000Z')

    expect(date.getDate()).toBe(30)
    expect(date.getMonth()).toBe(10)
    expect(date.getFullYear()).toBe(2025)
  })

  it('faz o ciclo completo sem deslocar o dia', () => {
    for (const day of [1, 15, 28, 31]) {
      const original = new Date(2025, 0, day)
      expect(fromUtcIso(toUtcIso(original)).getDate()).toBe(day)
    }
  })

  it('não volta um dia para datas no primeiro dia do mês', () => {
    expect(formatShortDate('2025-12-01T00:00:00.000Z')).toBe('01/12/25')
  })
})

describe('formatShortDate', () => {
  it('usa o formato dd/MM/yy das listagens', () => {
    expect(formatShortDate('2025-11-30T00:00:00.000Z')).toBe('30/11/25')
    expect(formatShortDate('2025-01-05T00:00:00.000Z')).toBe('05/01/25')
  })
})

describe('formatPeriod', () => {
  it('escreve o mês por extenso em português, capitalizado', () => {
    expect(formatPeriod(11, 2025)).toBe('Novembro / 2025')
    expect(formatPeriod(1, 2026)).toBe('Janeiro / 2026')
  })
})

describe('recentPeriods', () => {
  it('começa no mês atual e caminha para trás', () => {
    const periods = recentPeriods(3)
    const now = new Date()

    expect(periods).toHaveLength(3)
    expect(periods[0].month).toBe(now.getMonth() + 1)
    expect(periods[0].year).toBe(now.getFullYear())
  })

  it('atravessa a virada de ano corretamente', () => {
    const periods = recentPeriods(14)
    const meses = new Set(periods.map((p) => `${p.year}-${p.month}`))

    expect(meses.size).toBe(14)
    expect(periods.every((p) => p.month >= 1 && p.month <= 12)).toBe(true)
  })
})
