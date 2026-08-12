import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHarness, errorCode, type Harness } from './helpers/harness.js'

let h: Harness
let alice: { token: string; userId: string }
let bob: { token: string; userId: string }
let aliceCategoryId: string
let aliceTransactionId: string

const CATEGORY_INPUT = { title: 'Categoria da Alice', icon: 'briefcase', color: 'GREEN' }

beforeAll(async () => {
  h = await createHarness('isolation')

  alice = await h.signUp('alice@teste.com', 'Alice Andrade')
  bob = await h.signUp('bob@teste.com', 'Bob Barbosa')

  const category = await h.run<{ createCategory: { id: string } }>(
    'mutation ($input: CategoryInput!) { createCategory(input: $input) { id } }',
    { input: CATEGORY_INPUT },
    alice.token,
  )
  aliceCategoryId = category.data!.createCategory.id

  const transaction = await h.run<{ createTransaction: { id: string } }>(
    'mutation ($input: TransactionInput!) { createTransaction(input: $input) { id } }',
    {
      input: {
        description: 'Salário da Alice',
        amountCents: 500_000,
        date: '2025-11-05T00:00:00.000Z',
        type: 'INCOME',
        categoryId: aliceCategoryId,
      },
    },
    alice.token,
  )
  aliceTransactionId = transaction.data!.createTransaction.id
})
afterAll(() => h.close())

describe('leitura', () => {
  it('Bob não enxerga as categorias da Alice na listagem', async () => {
    const { data } = await h.run<{ categories: unknown[] }>('{ categories { id title } }', {}, bob.token)
    expect(data?.categories).toEqual([])
  })

  it('Bob não enxerga as transações da Alice na listagem', async () => {
    const { data } = await h.run<{ transactions: { items: unknown[]; total: number } }>(
      '{ transactions { items { id } total } }',
      {},
      bob.token,
    )

    expect(data?.transactions.items).toEqual([])
    expect(data?.transactions.total).toBe(0)
  })

  it('Bob não acessa a categoria da Alice por id', async () => {
    const { data } = await h.run<{ category: null }>(
      'query ($id: ID!) { category(id: $id) { id title } }',
      { id: aliceCategoryId },
      bob.token,
    )

    expect(data?.category).toBeNull()
  })

  it('Bob não acessa a transação da Alice por id', async () => {
    const { data } = await h.run<{ transaction: null }>(
      'query ($id: ID!) { transaction(id: $id) { id description } }',
      { id: aliceTransactionId },
      bob.token,
    )

    expect(data?.transaction).toBeNull()
  })

  it('o resumo do Bob ignora o dinheiro da Alice', async () => {
    const { data } = await h.run<{ summary: { balanceCents: number } }>(
      '{ summary(month: 11, year: 2025) { balanceCents incomeCents expenseCents } }',
      {},
      bob.token,
    )

    expect(data?.summary).toMatchObject({ balanceCents: 0, incomeCents: 0, expenseCents: 0 })
  })

  it('as estatísticas do Bob ignoram os dados da Alice', async () => {
    const { data } = await h.run<{
      categoryStats: { totalCategories: number; totalTransactions: number; mostUsed: null }
    }>('{ categoryStats { totalCategories totalTransactions mostUsed { id } } }', {}, bob.token)

    expect(data?.categoryStats).toMatchObject({
      totalCategories: 0,
      totalTransactions: 0,
      mostUsed: null,
    })
  })
})

describe('escrita', () => {
  it('Bob não edita a categoria da Alice', async () => {
    const { errors } = await h.run(
      'mutation ($id: ID!, $input: CategoryInput!) { updateCategory(id: $id, input: $input) { id title } }',
      { id: aliceCategoryId, input: { ...CATEGORY_INPUT, title: 'Invadida pelo Bob' } },
      bob.token,
    )

    expect(errorCode(errors)).toBe('NOT_FOUND')

    const original = await h.db.category.findUnique({ where: { id: aliceCategoryId } })
    expect(original?.title).toBe('Categoria da Alice')
  })

  it('Bob não deleta a categoria da Alice', async () => {
    const { errors } = await h.run(
      'mutation ($id: ID!) { deleteCategory(id: $id) }',
      { id: aliceCategoryId },
      bob.token,
    )

    expect(errorCode(errors)).toBe('NOT_FOUND')
    expect(await h.db.category.findUnique({ where: { id: aliceCategoryId } })).not.toBeNull()
  })

  it('Bob não edita a transação da Alice', async () => {
    const { errors } = await h.run(
      'mutation ($id: ID!, $input: TransactionInput!) { updateTransaction(id: $id, input: $input) { id } }',
      {
        id: aliceTransactionId,
        input: {
          description: 'Desviado para o Bob',
          amountCents: 1,
          date: '2025-11-05T00:00:00.000Z',
          type: 'EXPENSE',
          categoryId: null,
        },
      },
      bob.token,
    )

    expect(errorCode(errors)).toBe('NOT_FOUND')

    const original = await h.db.transaction.findUnique({ where: { id: aliceTransactionId } })
    expect(original).toMatchObject({ description: 'Salário da Alice', amountCents: 500_000 })
  })

  it('Bob não deleta a transação da Alice', async () => {
    const { errors } = await h.run(
      'mutation ($id: ID!) { deleteTransaction(id: $id) }',
      { id: aliceTransactionId },
      bob.token,
    )

    expect(errorCode(errors)).toBe('NOT_FOUND')
    expect(await h.db.transaction.findUnique({ where: { id: aliceTransactionId } })).not.toBeNull()
  })

  it('Bob não cria uma transação dentro da categoria da Alice', async () => {
    const { errors } = await h.run(
      'mutation ($input: TransactionInput!) { createTransaction(input: $input) { id } }',
      {
        input: {
          description: 'Tentativa do Bob',
          amountCents: 1_000,
          date: '2025-11-05T00:00:00.000Z',
          type: 'EXPENSE',
          categoryId: aliceCategoryId,
        },
      },
      bob.token,
    )

    expect(errorCode(errors)).toBe('BAD_USER_INPUT')

    const aggregate = await h.db.transaction.count({ where: { categoryId: aliceCategoryId } })
    expect(aggregate).toBe(1)
  })

  it('Bob não move a própria transação para a categoria da Alice', async () => {
    const criada = await h.run<{ createTransaction: { id: string } }>(
      'mutation ($input: TransactionInput!) { createTransaction(input: $input) { id } }',
      {
        input: {
          description: 'Transação do Bob',
          amountCents: 2_000,
          date: '2025-11-07T00:00:00.000Z',
          type: 'EXPENSE',
          categoryId: null,
        },
      },
      bob.token,
    )

    const { errors } = await h.run(
      'mutation ($id: ID!, $input: TransactionInput!) { updateTransaction(id: $id, input: $input) { id } }',
      {
        id: criada.data!.createTransaction.id,
        input: {
          description: 'Transação do Bob',
          amountCents: 2_000,
          date: '2025-11-07T00:00:00.000Z',
          type: 'EXPENSE',
          categoryId: aliceCategoryId,
        },
      },
      bob.token,
    )

    expect(errorCode(errors)).toBe('BAD_USER_INPUT')
  })
})

describe('a Alice continua com tudo intacto', () => {
  it('mantém sua categoria e sua transação após todas as tentativas do Bob', async () => {
    const { data } = await h.run<{
      categories: { title: string; transactionCount: number }[]
      transactions: { total: number }
      summary: { balanceCents: number }
    }>(
      `{
        categories { title transactionCount }
        transactions { total }
        summary(month: 11, year: 2025) { balanceCents }
      }`,
      {},
      alice.token,
    )

    expect(data?.categories).toEqual([{ title: 'Categoria da Alice', transactionCount: 1 }])
    expect(data?.transactions.total).toBe(1)
    expect(data?.summary.balanceCents).toBe(500_000)
  })
})
