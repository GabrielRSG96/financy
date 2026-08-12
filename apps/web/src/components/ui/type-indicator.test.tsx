import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TypeIndicator } from './type-indicator'

describe('TypeIndicator', () => {
  it('mostra "Entrada" em verde para receitas', () => {
    render(<TypeIndicator type="INCOME" />)
    expect(screen.getByText('Entrada')).toHaveClass('text-income')
  })

  it('mostra "Saída" em vermelho para despesas', () => {
    render(<TypeIndicator type="EXPENSE" />)
    expect(screen.getByText('Saída')).toHaveClass('text-expense')
  })

  it('mantém o rótulo acessível mesmo exibindo só o ícone', () => {
    render(<TypeIndicator type="INCOME" showLabel={false} />)
    // Visualmente escondido, mas continua legível para leitores de tela.
    expect(screen.getByText('Entrada')).toHaveClass('sr-only')
  })
})
