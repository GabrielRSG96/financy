import DataLoader from 'dataloader'
import type { Db } from './prisma.js'

export interface CategoryAggregate {
  count: number
  incomeCents: number
  expenseCents: number
  /** Entradas menos saídas — pode ser negativo. */
  balanceCents: number
}

const EMPTY: CategoryAggregate = { count: 0, incomeCents: 0, expenseCents: 0, balanceCents: 0 }

/**
 * Loaders criados por request. O objetivo é evitar N+1 ao resolver os campos
 * agregados de `Category`: em vez de uma query por categoria da lista, um único
 * groupBy cobre todas as categorias do batch.
 *
 * O agrupamento inclui `type` porque somar entradas e saídas no mesmo balde
 * daria um número sem significado — uma receita de R$ 800 com uma despesa de
 * R$ 400 tem saldo de R$ 400, não de R$ 1.200.
 */
export function createLoaders(db: Db, userId: string | null) {
  const categoryAggregates = new DataLoader<string, CategoryAggregate>(async (categoryIds) => {
    if (!userId) return categoryIds.map(() => EMPTY)

    const rows = await db.transaction.groupBy({
      by: ['categoryId', 'type'],
      where: { userId, categoryId: { in: [...categoryIds] } },
      _count: { _all: true },
      _sum: { amountCents: true },
    })

    const byId = new Map<string, CategoryAggregate>()

    for (const row of rows) {
      const id = row.categoryId as string
      const current = byId.get(id) ?? { ...EMPTY }
      const amount = row._sum.amountCents ?? 0

      current.count += row._count._all
      if (row.type === 'INCOME') current.incomeCents += amount
      else current.expenseCents += amount

      byId.set(id, current)
    }

    for (const aggregate of byId.values()) {
      aggregate.balanceCents = aggregate.incomeCents - aggregate.expenseCents
    }

    return categoryIds.map((id) => byId.get(id) ?? EMPTY)
  })

  return { categoryAggregates }
}

export type Loaders = ReturnType<typeof createLoaders>
