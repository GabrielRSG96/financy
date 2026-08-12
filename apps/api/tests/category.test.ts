import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CATEGORY_FIELDS, createHarness, errorCode, type Harness } from './helpers/harness.js'

let h: Harness
let token: string

beforeAll(async () => {
  h = await createHarness('category')
  token = (await h.signUp('categorias@teste.com')).token
})
afterAll(() => h.close())

const CREATE = `mutation ($input: CategoryInput!) { createCategory(input: $input) { ${CATEGORY_FIELDS} } }`
const UPDATE = `mutation ($id: ID!, $input: CategoryInput!) { updateCategory(id: $id, input: $input) { ${CATEGORY_FIELDS} } }`
const DELETE = `mutation ($id: ID!) { deleteCategory(id: $id) }`
const LIST = `{ categories { ${CATEGORY_FIELDS} } }`

const validInput = {
  title: 'Alimentação',
  description: 'Restaurantes, delivery e refeições',
  icon: 'utensils',
  color: 'BLUE',
}

async function createCategory(input: Record<string, unknown>, as = token) {
  const { data, errors } = await h.run<{ createCategory: { id: string; title: string } }>(
    CREATE,
    { input },
    as,
  )
  return { category: data?.createCategory, errors }
}

interface AggregatedCategory {
  title: string
  transactionCount: number
  incomeCents: number
  expenseCents: number
  balanceCents: number
}

/** Cria uma transação vinculada a uma categoria; usado nos testes de agregação. */
async function novaTransacao(
  as: string,
  categoryId: string,
  description: string,
  amountCents = 1_000,
  type: 'INCOME' | 'EXPENSE' = 'EXPENSE',
) {
  const { errors } = await h.run(
    `mutation ($input: TransactionInput!) { createTransaction(input: $input) { id } }`,
    {
      input: { description, amountCents, date: '2025-11-10T00:00:00.000Z', type, categoryId },
    },
    as,
  )
  // Falhar aqui em silêncio faria as asserções de agregação testarem zero.
  if (errors) throw new Error(`Falha ao criar transação: ${errors[0]?.message}`)
}

describe('criar categoria', () => {
  it('cria com todos os campos', async () => {
    const { category, errors } = await createCategory(validInput)

    expect(errors).toBeUndefined()
    expect(category).toMatchObject({
      title: 'Alimentação',
      description: 'Restaurantes, delivery e refeições',
      icon: 'utensils',
      color: 'BLUE',
      transactionCount: 0,
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
    })
  })

  it('aceita descrição vazia gravando null', async () => {
    const { category } = await createCategory({ ...validInput, title: 'Sem Descrição', description: '' })
    expect(category).toMatchObject({ description: null })
  })

  it('recusa ícone fora da allow-list', async () => {
    const { errors } = await createCategory({ ...validInput, title: 'Ícone Ruim', icon: 'skull' })
    expect(errorCode(errors)).toBe('BAD_USER_INPUT')
  })

  it('recusa cor fora do enum', async () => {
    const { errors } = await h.run(CREATE, { input: { ...validInput, color: 'CYAN' } }, token)
    // Enum inválido é barrado pela própria validação do GraphQL.
    expect(errors?.length).toBeGreaterThan(0)
  })

  it('recusa título duplicado para o mesmo usuário', async () => {
    await createCategory({ ...validInput, title: 'Repetida' })
    const { errors } = await createCategory({ ...validInput, title: 'Repetida' })

    expect(errorCode(errors)).toBe('CONFLICT')
  })

  it('permite o mesmo título para usuários diferentes', async () => {
    const outro = await h.signUp('outro-titulo@teste.com')
    const { errors } = await createCategory({ ...validInput, title: 'Compartilhada' })
    const { errors: outroErros } = await createCategory(
      { ...validInput, title: 'Compartilhada' },
      outro.token,
    )

    expect(errors).toBeUndefined()
    expect(outroErros).toBeUndefined()
  })

  it('exige autenticação', async () => {
    const { errors } = await h.run(CREATE, { input: validInput })
    expect(errorCode(errors)).toBe('UNAUTHENTICATED')
  })
})

describe('listar categorias', () => {
  it('devolve apenas as categorias do usuário, ordenadas por título', async () => {
    const solo = await h.signUp('lista-categorias@teste.com')
    for (const title of ['Zebra', 'Abacate', 'Mercado']) {
      await createCategory({ ...validInput, title }, solo.token)
    }

    const { data } = await h.run<{ categories: { title: string }[] }>(LIST, {}, solo.token)

    expect(data?.categories.map((c) => c.title)).toEqual(['Abacate', 'Mercado', 'Zebra'])
  })
})

describe('editar categoria', () => {
  it('atualiza os campos', async () => {
    const { category } = await createCategory({ ...validInput, title: 'Para Editar' })

    const { data, errors } = await h.run<{ updateCategory: Record<string, unknown> }>(
      UPDATE,
      { id: category!.id, input: { ...validInput, title: 'Editada', color: 'PINK', icon: 'ticket' } },
      token,
    )

    expect(errors).toBeUndefined()
    expect(data?.updateCategory).toMatchObject({ title: 'Editada', color: 'PINK', icon: 'ticket' })
  })

  it('permite salvar mantendo o próprio título', async () => {
    const { category } = await createCategory({ ...validInput, title: 'Mesmo Título' })

    const { errors } = await h.run(
      UPDATE,
      { id: category!.id, input: { ...validInput, title: 'Mesmo Título', color: 'RED' } },
      token,
    )

    expect(errors).toBeUndefined()
  })

  it('recusa título que já pertence a outra categoria', async () => {
    await createCategory({ ...validInput, title: 'Ocupada' })
    const { category } = await createCategory({ ...validInput, title: 'Vai Colidir' })

    const { errors } = await h.run(
      UPDATE,
      { id: category!.id, input: { ...validInput, title: 'Ocupada' } },
      token,
    )

    expect(errorCode(errors)).toBe('CONFLICT')
  })

  it('erra em id inexistente', async () => {
    const { errors } = await h.run(UPDATE, { id: 'nao-existe', input: validInput }, token)
    expect(errorCode(errors)).toBe('NOT_FOUND')
  })
})

describe('deletar categoria', () => {
  it('remove a categoria', async () => {
    const { category } = await createCategory({ ...validInput, title: 'Descartável' })

    const { data, errors } = await h.run<{ deleteCategory: boolean }>(DELETE, { id: category!.id }, token)
    expect(errors).toBeUndefined()
    expect(data?.deleteCategory).toBe(true)

    const check = await h.run<{ category: null }>(
      'query ($id: ID!) { category(id: $id) { id } }',
      { id: category!.id },
      token,
    )
    expect(check.data?.category).toBeNull()
  })

  it('preserva as transações, apenas desvinculando a categoria', async () => {
    const { category } = await createCategory({ ...validInput, title: 'Com Transações' })

    await h.run(
      `mutation ($input: TransactionInput!) { createTransaction(input: $input) { id } }`,
      {
        input: {
          description: 'Compra que deve sobreviver',
          amountCents: 5_000,
          date: '2025-11-10T00:00:00.000Z',
          type: 'EXPENSE',
          categoryId: category!.id,
        },
      },
      token,
    )

    await h.run(DELETE, { id: category!.id }, token)

    const { data } = await h.run<{ transactions: { items: { description: string; category: null }[] } }>(
      `query { transactions(filter: { search: "sobreviver" }) { items { description category { id } } } }`,
      {},
      token,
    )

    expect(data?.transactions.items).toHaveLength(1)
    expect(data?.transactions.items[0].category).toBeNull()
  })

  it('erra em id inexistente', async () => {
    const { errors } = await h.run(DELETE, { id: 'nao-existe' }, token)
    expect(errorCode(errors)).toBe('NOT_FOUND')
  })
})

describe('estatísticas', () => {
  it('conta categorias, transações e aponta a mais usada', async () => {
    const solo = await h.signUp('stats@teste.com')
    const { category: usada } = await createCategory({ ...validInput, title: 'Mais Usada' }, solo.token)
    const { category: rara } = await createCategory({ ...validInput, title: 'Pouco Usada' }, solo.token)

    await novaTransacao(solo.token, usada!.id, 'Primeira compra')
    await novaTransacao(solo.token, usada!.id, 'Segunda compra')
    await novaTransacao(solo.token, rara!.id, 'Compra isolada')

    const { data } = await h.run<{
      categoryStats: { totalCategories: number; totalTransactions: number; mostUsed: { title: string } }
    }>('{ categoryStats { totalCategories totalTransactions mostUsed { title } } }', {}, solo.token)

    expect(data?.categoryStats.totalCategories).toBe(2)
    expect(data?.categoryStats.totalTransactions).toBe(3)
    expect(data?.categoryStats.mostUsed.title).toBe('Mais Usada')
  })

  it('devolve mostUsed null quando não há transações', async () => {
    const solo = await h.signUp('stats-vazio@teste.com')

    const { data } = await h.run<{ categoryStats: { mostUsed: null; totalCategories: number } }>(
      '{ categoryStats { totalCategories mostUsed { title } } }',
      {},
      solo.token,
    )

    expect(data?.categoryStats.totalCategories).toBe(0)
    expect(data?.categoryStats.mostUsed).toBeNull()
  })

  it('agrega contagem e saldo de uma categoria só de despesas', async () => {
    const solo = await h.signUp('agregado@teste.com')
    const { category } = await createCategory({ ...validInput, title: 'Agregada' }, solo.token)

    for (const amountCents of [1_000, 2_500, 4_000]) {
      await novaTransacao(solo.token, category!.id, `Gasto de ${amountCents}`, amountCents, 'EXPENSE')
    }

    const { data } = await h.run<{ categories: AggregatedCategory[] }>(LIST, {}, solo.token)

    expect(data?.categories[0]).toMatchObject({
      transactionCount: 3,
      incomeCents: 0,
      expenseCents: 7_500,
      // Só há saídas, então o saldo é negativo.
      balanceCents: -7_500,
    })
  })

  it('compensa entradas e saídas na mesma categoria em vez de somá-las', async () => {
    const solo = await h.signUp('saldo-misto@teste.com')
    const { category } = await createCategory({ ...validInput, title: 'Mista' }, solo.token)

    await novaTransacao(solo.token, category!.id, 'Receita da categoria', 80_000, 'INCOME')
    await novaTransacao(solo.token, category!.id, 'Despesa da categoria', 40_000, 'EXPENSE')

    const { data } = await h.run<{ categories: AggregatedCategory[] }>(LIST, {}, solo.token)

    expect(data?.categories[0]).toMatchObject({
      transactionCount: 2,
      incomeCents: 80_000,
      expenseCents: 40_000,
      // R$ 800 de entrada e R$ 400 de saída dão R$ 400 de saldo — não R$ 1.200.
      balanceCents: 40_000,
    })
  })

  it('zera o saldo quando entradas e saídas se anulam', async () => {
    const solo = await h.signUp('saldo-zero@teste.com')
    const { category } = await createCategory({ ...validInput, title: 'Empatada' }, solo.token)

    await novaTransacao(solo.token, category!.id, 'Empréstimo recebido', 25_000, 'INCOME')
    await novaTransacao(solo.token, category!.id, 'Empréstimo devolvido', 25_000, 'EXPENSE')

    const { data } = await h.run<{ categories: AggregatedCategory[] }>(LIST, {}, solo.token)

    expect(data?.categories[0]).toMatchObject({
      transactionCount: 2,
      balanceCents: 0,
    })
    // Saldo zerado não pode esconder que houve movimento na categoria.
    expect(data?.categories[0].incomeCents).toBe(25_000)
    expect(data?.categories[0].expenseCents).toBe(25_000)
  })

  it('mantém os agregados isolados entre categorias do mesmo usuário', async () => {
    const solo = await h.signUp('agregado-multiplo@teste.com')
    const { category: a } = await createCategory({ ...validInput, title: 'Alfa' }, solo.token)
    const { category: b } = await createCategory({ ...validInput, title: 'Beta' }, solo.token)

    await novaTransacao(solo.token, a!.id, 'Entrada do Alfa', 10_000, 'INCOME')
    await novaTransacao(solo.token, b!.id, 'Saída do Beta', 3_000, 'EXPENSE')

    const { data } = await h.run<{ categories: AggregatedCategory[] }>(LIST, {}, solo.token)
    const porTitulo = new Map(data!.categories.map((c) => [c.title, c]))

    expect(porTitulo.get('Alfa')).toMatchObject({ balanceCents: 10_000, expenseCents: 0 })
    expect(porTitulo.get('Beta')).toMatchObject({ balanceCents: -3_000, incomeCents: 0 })
  })
})
