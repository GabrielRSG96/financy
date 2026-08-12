import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHarness, errorCode, type Harness } from './helpers/harness.js'

let h: Harness
let token: string
let categoryId: string

const TX_FIELDS = 'id description amountCents date type category { id title }'
const CREATE = `mutation ($input: TransactionInput!) { createTransaction(input: $input) { ${TX_FIELDS} } }`
const UPDATE = `mutation ($id: ID!, $input: TransactionInput!) { updateTransaction(id: $id, input: $input) { ${TX_FIELDS} } }`
const DELETE = `mutation ($id: ID!) { deleteTransaction(id: $id) }`
const LIST = `
  query ($filter: TransactionFilter, $page: Int, $pageSize: Int) {
    transactions(filter: $filter, page: $page, pageSize: $pageSize) {
      items { ${TX_FIELDS} }
      total page pageSize totalPages
    }
  }
`

beforeAll(async () => {
  h = await createHarness('transaction')
  token = (await h.signUp('transacoes@teste.com')).token

  const { data } = await h.run<{ createCategory: { id: string } }>(
    'mutation ($input: CategoryInput!) { createCategory(input: $input) { id } }',
    { input: { title: 'Mercado', icon: 'shopping-cart', color: 'ORANGE' } },
    token,
  )
  categoryId = data!.createCategory.id
})
afterAll(() => h.close())

const baseInput = {
  description: 'Compras no Mercado',
  amountCents: 15_680,
  date: '2025-11-28T00:00:00.000Z',
  type: 'EXPENSE',
}

async function createTx(overrides: Record<string, unknown> = {}, as = token) {
  const { data, errors } = await h.run<{ createTransaction: { id: string } }>(
    CREATE,
    { input: { ...baseInput, categoryId, ...overrides } },
    as,
  )
  return { transaction: data?.createTransaction, errors }
}

describe('criar transação', () => {
  it('cria com categoria vinculada', async () => {
    const { data, errors } = await h.run<{ createTransaction: Record<string, unknown> }>(
      CREATE,
      { input: { ...baseInput, categoryId } },
      token,
    )

    expect(errors).toBeUndefined()
    expect(data?.createTransaction).toMatchObject({
      description: 'Compras no Mercado',
      amountCents: 15_680,
      type: 'EXPENSE',
      category: { id: categoryId, title: 'Mercado' },
    })
  })

  it('aceita transação sem categoria', async () => {
    const { transaction, errors } = await createTx({ categoryId: null, description: 'Sem categoria' })

    expect(errors).toBeUndefined()
    expect(transaction).toBeTruthy()
  })

  it('recusa valor zero ou negativo', async () => {
    const zero = await createTx({ amountCents: 0 })
    const negativo = await createTx({ amountCents: -500 })

    expect(errorCode(zero.errors)).toBe('BAD_USER_INPUT')
    expect(errorCode(negativo.errors)).toBe('BAD_USER_INPUT')
  })

  it('recusa descrição muito curta', async () => {
    const { errors } = await createTx({ description: 'x' })
    expect(errorCode(errors)).toBe('BAD_USER_INPUT')
  })

  it('recusa categoria de outro usuário', async () => {
    const intruso = await h.signUp('intruso-tx@teste.com')

    const { errors } = await createTx({}, intruso.token)
    expect(errorCode(errors)).toBe('BAD_USER_INPUT')
  })

  it('exige autenticação', async () => {
    const { errors } = await h.run(CREATE, { input: baseInput })
    expect(errorCode(errors)).toBe('UNAUTHENTICATED')
  })
})

describe('listar e filtrar', () => {
  let solo: { token: string }
  let alimentacao: string

  beforeAll(async () => {
    solo = await h.signUp('filtros@teste.com')

    const { data } = await h.run<{ createCategory: { id: string } }>(
      'mutation ($input: CategoryInput!) { createCategory(input: $input) { id } }',
      { input: { title: 'Alimentação', icon: 'utensils', color: 'BLUE' } },
      solo.token,
    )
    alimentacao = data!.createCategory.id

    const fixtures = [
      { description: 'Jantar no Restaurante', amountCents: 8_950, date: '2025-11-30T00:00:00.000Z', type: 'EXPENSE', categoryId: alimentacao },
      { description: 'Pagamento de Salário', amountCents: 425_000, date: '2025-11-01T00:00:00.000Z', type: 'INCOME', categoryId: null },
      { description: 'Cinema', amountCents: 8_800, date: '2025-10-18T00:00:00.000Z', type: 'EXPENSE', categoryId: null },
      { description: 'Almoço rápido', amountCents: 3_200, date: '2025-11-12T00:00:00.000Z', type: 'EXPENSE', categoryId: alimentacao },
    ]

    for (const input of fixtures) {
      await h.run(CREATE, { input }, solo.token)
    }
  })

  const list = (variables: Record<string, unknown> = {}) =>
    h.run<{ transactions: { items: { description: string }[]; total: number; totalPages: number } }>(
      LIST,
      variables,
      solo.token,
    )

  it('ordena da mais recente para a mais antiga', async () => {
    const { data } = await list()

    expect(data?.transactions.items.map((t) => t.description)).toEqual([
      'Jantar no Restaurante',
      'Almoço rápido',
      'Pagamento de Salário',
      'Cinema',
    ])
  })

  it('filtra por trecho da descrição ignorando maiúsculas', async () => {
    const { data } = await list({ filter: { search: 'jantar' } })

    expect(data?.transactions.total).toBe(1)
    expect(data?.transactions.items[0].description).toBe('Jantar no Restaurante')
  })

  it('filtra por tipo', async () => {
    const { data } = await list({ filter: { type: 'INCOME' } })

    expect(data?.transactions.total).toBe(1)
    expect(data?.transactions.items[0].description).toBe('Pagamento de Salário')
  })

  it('filtra por categoria', async () => {
    const { data } = await list({ filter: { categoryId: alimentacao } })
    expect(data?.transactions.total).toBe(2)
  })

  it('filtra por período (mês/ano)', async () => {
    const novembro = await list({ filter: { month: 11, year: 2025 } })
    const outubro = await list({ filter: { month: 10, year: 2025 } })

    expect(novembro.data?.transactions.total).toBe(3)
    expect(outubro.data?.transactions.total).toBe(1)
    expect(outubro.data?.transactions.items[0].description).toBe('Cinema')
  })

  it('combina filtros', async () => {
    const { data } = await list({ filter: { type: 'EXPENSE', month: 11, year: 2025 } })
    expect(data?.transactions.total).toBe(2)
  })

  it('pagina os resultados', async () => {
    const primeira = await list({ page: 1, pageSize: 3 })
    const segunda = await list({ page: 2, pageSize: 3 })

    expect(primeira.data?.transactions.items).toHaveLength(3)
    expect(primeira.data?.transactions.total).toBe(4)
    expect(primeira.data?.transactions.totalPages).toBe(2)
    expect(segunda.data?.transactions.items).toHaveLength(1)
  })

  it('devolve página vazia com totalPages 1 quando não há resultados', async () => {
    const { data } = await list({ filter: { search: 'inexistente-xyz' } })

    expect(data?.transactions.items).toHaveLength(0)
    expect(data?.transactions.total).toBe(0)
    expect(data?.transactions.totalPages).toBe(1)
  })
})

describe('editar e deletar', () => {
  it('atualiza os campos da transação', async () => {
    const { transaction } = await createTx({ description: 'Antes da edição' })

    const { data, errors } = await h.run<{ updateTransaction: Record<string, unknown> }>(
      UPDATE,
      {
        id: transaction!.id,
        input: {
          description: 'Depois da edição',
          amountCents: 9_999,
          date: '2025-12-01T00:00:00.000Z',
          type: 'INCOME',
          categoryId: null,
        },
      },
      token,
    )

    expect(errors).toBeUndefined()
    expect(data?.updateTransaction).toMatchObject({
      description: 'Depois da edição',
      amountCents: 9_999,
      type: 'INCOME',
      category: null,
    })
  })

  it('deleta a transação', async () => {
    const { transaction } = await createTx({ description: 'Para deletar' })

    const { data } = await h.run<{ deleteTransaction: boolean }>(DELETE, { id: transaction!.id }, token)
    expect(data?.deleteTransaction).toBe(true)

    const check = await h.run<{ transaction: null }>(
      'query ($id: ID!) { transaction(id: $id) { id } }',
      { id: transaction!.id },
      token,
    )
    expect(check.data?.transaction).toBeNull()
  })

  it('erra ao editar ou deletar id inexistente', async () => {
    const edicao = await h.run(UPDATE, { id: 'nao-existe', input: baseInput }, token)
    const remocao = await h.run(DELETE, { id: 'nao-existe' }, token)

    expect(errorCode(edicao.errors)).toBe('NOT_FOUND')
    expect(errorCode(remocao.errors)).toBe('NOT_FOUND')
  })
})

describe('resumo financeiro', () => {
  it('calcula saldo de todo o histórico e entradas/saídas do mês', async () => {
    const solo = await h.signUp('resumo@teste.com')

    const fixtures = [
      { amountCents: 400_000, date: '2025-11-05T00:00:00.000Z', type: 'INCOME' },
      { amountCents: 25_000, date: '2025-11-06T00:00:00.000Z', type: 'EXPENSE' },
      { amountCents: 100_000, date: '2025-10-05T00:00:00.000Z', type: 'INCOME' },
      { amountCents: 50_000, date: '2025-10-06T00:00:00.000Z', type: 'EXPENSE' },
    ]

    for (const [index, fixture] of fixtures.entries()) {
      await h.run(CREATE, { input: { ...fixture, description: `Lançamento ${index}` } }, solo.token)
    }

    const { data } = await h.run<{ summary: { balanceCents: number; incomeCents: number; expenseCents: number } }>(
      'query ($month: Int, $year: Int) { summary(month: $month, year: $year) { balanceCents incomeCents expenseCents } }',
      { month: 11, year: 2025 },
      solo.token,
    )

    expect(data?.summary.balanceCents).toBe(425_000)
    expect(data?.summary.incomeCents).toBe(400_000)
    expect(data?.summary.expenseCents).toBe(25_000)
  })

  it('devolve zeros para um usuário sem transações', async () => {
    const solo = await h.signUp('resumo-vazio@teste.com')

    const { data } = await h.run<{ summary: { balanceCents: number } }>(
      '{ summary { balanceCents incomeCents expenseCents } }',
      {},
      solo.token,
    )

    expect(data?.summary).toMatchObject({ balanceCents: 0, incomeCents: 0, expenseCents: 0 })
  })
})
