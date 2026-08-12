import DataLoader from 'dataloader'
import type { Db } from './prisma.js'

export interface CategoryAggregate {
  count: number
  incomeCents: number
  expenseCents: number
  balanceCents: number
}

const EMPTY: CategoryAggregate = { count: 0, incomeCents: 0, expenseCents: 0, balanceCents: 0 }

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
