import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from './login'

// A validação é o que testamos aqui; a chamada de rede não precisa acontecer.
vi.mock('@/graphql/client', async () => {
  const actual = await vi.importActual<typeof import('@/graphql/client')>('@/graphql/client')
  return { ...actual, request: vi.fn().mockRejectedValue(new Error('sem rede no teste')) }
})

vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({ user: null, loading: false, signIn: vi.fn(), signOut: vi.fn(), setUser: vi.fn() }),
}))

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  it('renderiza os campos do Figma', () => {
    renderLogin()

    expect(screen.getByText('Fazer login')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Lembrar-me')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /criar conta/i })).toBeInTheDocument()
  })

  it('cobra e-mail e senha antes de enviar', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe seu e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  })

  it('recusa e-mail em formato inválido', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('E-mail'), 'nao-e-um-email')
    await user.type(screen.getByLabelText('Senha'), 'senha12345')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument()
  })

  it('alterna a visibilidade da senha', async () => {
    const user = userEvent.setup()
    renderLogin()

    const senha = screen.getByLabelText('Senha')
    expect(senha).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(senha).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(senha).toHaveAttribute('type', 'password')
  })
})
