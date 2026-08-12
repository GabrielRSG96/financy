import { describe, expect, it } from 'vitest'
import {
  formatAmount,
  formatBalance,
  formatCurrency,
  formatSignedCurrency,
  maskAmount,
  parseAmountToCents,
} from './format'

/** Intl usa espaço não-quebrável (U+00A0) depois do "R$"; normaliza para comparar. */
const norm = (value: string) => value.replace(/\u00a0/g, ' ')

describe('formatCurrency', () => {
  it('formata centavos como moeda brasileira', () => {
    expect(norm(formatCurrency(425_000))).toBe('R$ 4.250,00')
    expect(norm(formatCurrency(8_950))).toBe('R$ 89,50')
    expect(norm(formatCurrency(0))).toBe('R$ 0,00')
  })

  it('formata valores negativos (saldo no vermelho)', () => {
    expect(norm(formatCurrency(-15_000))).toBe('-R$ 150,00')
  })
})

describe('formatSignedCurrency', () => {
  it('usa + para entradas e - para saídas', () => {
    expect(norm(formatSignedCurrency(425_000, 'INCOME'))).toBe('+ R$ 4.250,00')
    expect(norm(formatSignedCurrency(8_950, 'EXPENSE'))).toBe('- R$ 89,50')
  })
})

describe('formatBalance', () => {
  it('marca saldo positivo com + e negativo com -', () => {
    expect(norm(formatBalance(40_000))).toBe('+ R$ 400,00')
    expect(norm(formatBalance(-40_000))).toBe('- R$ 400,00')
  })

  it('mostra saldo zerado sem sinal', () => {
    expect(norm(formatBalance(0))).toBe('R$ 0,00')
  })

  it('representa o caso de entrada e saída na mesma categoria', () => {
    // R$ 800 de receita menos R$ 400 de despesa = R$ 400 de saldo, não R$ 1.200.
    const receita = 80_000
    const despesa = 40_000
    expect(norm(formatBalance(receita - despesa))).toBe('+ R$ 400,00')
  })

  it('nunca duplica o sinal de menos', () => {
    expect(norm(formatBalance(-1))).toBe('- R$ 0,01')
    expect(formatBalance(-40_000)).not.toContain('--')
  })
})

describe('parseAmountToCents', () => {
  it('lê apenas os dígitos, tratando o valor como centavos', () => {
    expect(parseAmountToCents('123456')).toBe(123_456)
    expect(parseAmountToCents('1.234,56')).toBe(123_456)
    expect(parseAmountToCents('5000')).toBe(5_000)
  })

  it('devolve zero para entrada vazia ou sem dígitos', () => {
    expect(parseAmountToCents('')).toBe(0)
    expect(parseAmountToCents('abc')).toBe(0)
    expect(parseAmountToCents('R$ ,')).toBe(0)
  })

  it('ignora o sinal de menos — o tipo é que define entrada ou saída', () => {
    expect(parseAmountToCents('-500')).toBe(500)
  })
})

describe('maskAmount', () => {
  it('formata o que está sendo digitado, da direita para a esquerda', () => {
    expect(maskAmount('5')).toBe('0,05')
    expect(maskAmount('50')).toBe('0,50')
    expect(maskAmount('5000')).toBe('50,00')
    expect(maskAmount('123456')).toBe('1.234,56')
  })

  it('é idempotente: remascarar um valor já formatado não o altera', () => {
    expect(maskAmount(maskAmount('123456'))).toBe('1.234,56')
  })
})

describe('formatAmount', () => {
  it('formata sem o símbolo da moeda, para o input do formulário', () => {
    expect(formatAmount(123_456)).toBe('1.234,56')
    expect(formatAmount(0)).toBe('0,00')
  })

  it('faz o ciclo completo sem perder precisão', () => {
    for (const cents of [1, 99, 100, 12_345, 999_999_99]) {
      expect(parseAmountToCents(formatAmount(cents))).toBe(cents)
    }
  })
})
