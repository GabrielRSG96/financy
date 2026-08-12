import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CATEGORY_COLORS, COLOR_TOKENS } from '@/lib/categories'
import { NeutralTag, Tag } from './tag'

describe('Tag', () => {
  it('exibe o rótulo', () => {
    render(<Tag label="Alimentação" color="BLUE" />)
    expect(screen.getByText('Alimentação')).toBeInTheDocument()
  })

  it('aplica as classes de fundo e texto da cor escolhida', () => {
    render(<Tag label="Mercado" color="ORANGE" />)
    const tag = screen.getByText('Mercado')

    expect(tag).toHaveClass(COLOR_TOKENS.ORANGE.soft)
    expect(tag).toHaveClass(COLOR_TOKENS.ORANGE.strong)
  })

  it('cobre as sete cores do styleguide com tokens distintos', () => {
    const fundos = new Set(CATEGORY_COLORS.map((color) => COLOR_TOKENS[color].soft))
    expect(fundos.size).toBe(7)

    for (const color of CATEGORY_COLORS) {
      const { unmount } = render(<Tag label={color} color={color} />)
      expect(screen.getByText(color)).toHaveClass(COLOR_TOKENS[color].soft)
      unmount()
    }
  })
})

describe('NeutralTag', () => {
  it('serve às transações que ficaram sem categoria', () => {
    render(<NeutralTag label="Sem categoria" />)
    expect(screen.getByText('Sem categoria')).toBeInTheDocument()
  })
})
