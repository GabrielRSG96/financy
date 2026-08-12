import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHarness, errorCode, type Harness } from './helpers/harness.js'

let h: Harness

beforeAll(async () => {
  h = await createHarness('auth')
})
afterAll(() => h.close())

const SIGN_UP = `
  mutation ($name: String!, $email: String!, $password: String!) {
    signUp(name: $name, email: $email, password: $password) {
      token
      user { id name email initials }
    }
  }
`

const SIGN_IN = `
  mutation ($email: String!, $password: String!) {
    signIn(email: $email, password: $password) { token user { id email } }
  }
`

describe('cadastro', () => {
  it('cria a conta e devolve token com as iniciais do nome', async () => {
    const { data, errors } = await h.run<{ signUp: { token: string; user: { initials: string; email: string } } }>(
      SIGN_UP,
      { name: 'Conta teste', email: 'novo@teste.com', password: 'senha12345' },
    )

    expect(errors).toBeUndefined()
    expect(data?.signUp.token).toBeTruthy()
    expect(data?.signUp.user.initials).toBe('CT')
    expect(data?.signUp.user.email).toBe('novo@teste.com')
  })

  it('normaliza o e-mail para minúsculas', async () => {
    const { data } = await h.run<{ signUp: { user: { email: string } } }>(SIGN_UP, {
      name: 'Maiúsculas Silva',
      email: 'MAIUSCULAS@Teste.com',
      password: 'senha12345',
    })

    expect(data?.signUp.user.email).toBe('maiusculas@teste.com')
  })

  it('recusa e-mail já cadastrado', async () => {
    const vars = { name: 'Duplicado', email: 'duplicado@teste.com', password: 'senha12345' }
    await h.run(SIGN_UP, vars)

    const { errors } = await h.run(SIGN_UP, vars)
    expect(errorCode(errors)).toBe('CONFLICT')
  })

  it('recusa senha com menos de 8 caracteres', async () => {
    const { errors } = await h.run(SIGN_UP, {
      name: 'Senha Curta',
      email: 'curta@teste.com',
      password: '1234567',
    })

    expect(errorCode(errors)).toBe('BAD_USER_INPUT')
    expect(errors?.[0]?.message).toContain('8 caracteres')
  })

  it('recusa e-mail inválido', async () => {
    const { errors } = await h.run(SIGN_UP, {
      name: 'Email Ruim',
      email: 'nao-e-email',
      password: 'senha12345',
    })

    expect(errorCode(errors)).toBe('BAD_USER_INPUT')
  })

  it('nunca expõe o hash da senha no schema', async () => {
    const { errors } = await h.run('{ me { id passwordHash } }')
    expect(errors?.[0]?.message).toMatch(/passwordHash/)
  })
})

describe('login', () => {
  beforeAll(async () => {
    await h.run(SIGN_UP, { name: 'Login Teste', email: 'login@teste.com', password: 'senha12345' })
  })

  it('autentica com as credenciais corretas', async () => {
    const { data, errors } = await h.run<{ signIn: { token: string } }>(SIGN_IN, {
      email: 'login@teste.com',
      password: 'senha12345',
    })

    expect(errors).toBeUndefined()
    expect(data?.signIn.token).toBeTruthy()
  })

  it('recusa senha incorreta sem revelar se o e-mail existe', async () => {
    const errado = await h.run(SIGN_IN, { email: 'login@teste.com', password: 'senha-errada' })
    const inexistente = await h.run(SIGN_IN, { email: 'nao-existe@teste.com', password: 'seja-la' })

    expect(errorCode(errado.errors)).toBe('UNAUTHENTICATED')
    expect(errado.errors?.[0]?.message).toBe(inexistente.errors?.[0]?.message)
  })
})

describe('sessão', () => {
  it('me devolve null sem token', async () => {
    const { data, errors } = await h.run<{ me: null }>('{ me { id } }')
    expect(errors).toBeUndefined()
    expect(data?.me).toBeNull()
  })

  it('me devolve null com token inválido', async () => {
    const { data } = await h.run<{ me: null }>('{ me { id } }', {}, 'token-falsificado')
    expect(data?.me).toBeNull()
  })

  it('bloqueia queries protegidas sem token', async () => {
    const { errors } = await h.run('{ categories { id } }')
    expect(errorCode(errors)).toBe('UNAUTHENTICATED')
  })

  it('permite atualizar o nome do perfil', async () => {
    const { token } = await h.signUp('perfil@teste.com', 'Nome Antigo')

    const { data, errors } = await h.run<{ updateProfile: { name: string; initials: string } }>(
      'mutation ($name: String!) { updateProfile(name: $name) { name initials } }',
      { name: 'Nome Novo Sobrenome' },
      token,
    )

    expect(errors).toBeUndefined()
    expect(data?.updateProfile.name).toBe('Nome Novo Sobrenome')
    expect(data?.updateProfile.initials).toBe('NS')
  })

  it('bloqueia atualização de perfil sem token', async () => {
    const { errors } = await h.run('mutation { updateProfile(name: "Hacker") { id } }')
    expect(errorCode(errors)).toBe('UNAUTHENTICATED')
  })
})
