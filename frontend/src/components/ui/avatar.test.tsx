import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './avatar'

describe('Avatar', () => {
  it('mostra as iniciais quando não há foto', () => {
    render(<Avatar initials="CT" />)
    expect(screen.getByText('CT')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('mostra a foto quando existe', () => {
    render(<Avatar initials="CT" src="http://localhost:4000/uploads/foto.webp" alt="Foto de Conta teste" />)

    const image = screen.getByRole('img', { name: 'Foto de Conta teste' })
    expect(image).toHaveAttribute('src', 'http://localhost:4000/uploads/foto.webp')
    expect(screen.queryByText('CT')).not.toBeInTheDocument()
  })

  it('trata avatarUrl nulo como ausência de foto', () => {
    render(<Avatar initials="AB" src={null} />)
    expect(screen.getByText('AB')).toBeInTheDocument()
  })
})
