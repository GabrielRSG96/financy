import DataLoader from 'dataloader'
import type { Db } from './prisma.js'

export interface CategoryAggregate {
  count: number
  totalCents: number
}

const EMPTY: CategoryAggregate = { count: 0, totalCents: 0 }

/**
 * Loaders criados por request. O objetivo é evitar N+1 ao resolver
 * `Category.transactionCount` / `Category.totalCents`: em vez de uma query por
 * categoria da lista, um único groupBy cobre todas as categorias do batch.
 */
export function createLoaders(db: Db, userId: string | null) {
  const categoryAggregates = new DataLoader<string, CategoryAggregate>(async (categoryIds) => {
    if (!userId) return categoryIds.map(() => EMPTY)

    const rows = await db.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, categoryId: { in: [...categoryIds] } },
      _count: { _all: true },
      _sum: { amountCents: true },
    })

    const byId = new Map<string, CategoryAggregate>(
      rows.map((row) => [
        row.categoryId as string,
        { count: row._count._all, totalCents: row._sum.amountCents ?? 0 },
      ]),
    )

    return categoryIds.map((id) => byId.get(id) ?? EMPTY)
  })

  return { categoryAggregates }
}

export type Loaders = ReturnType<typeof createLoaders>
