import type { Prisma, Transaction } from '@prisma/client'
import { z } from 'zod'
import { requireUser, type Context } from '../../context.js'
import { badRequest, notFound } from '../../lib/errors.js'
import { parseInput } from '../../lib/validation.js'
import { TRANSACTION_TYPES } from '../../shared/catalog.js'

const MAX_PAGE_SIZE = 100

const filterSchema = z.object({
  filter: z
    .object({
      search: z.string().trim().max(120).optional().nullable(),
      type: z.enum(TRANSACTION_TYPES).optional().nullable(),
      categoryId: z.string().optional().nullable(),
      month: z.number().int().min(1).max(12).optional().nullable(),
      year: z.number().int().min(1970).max(2999).optional().nullable(),
    })
    .optional()
    .nullable(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).default(10),
})

const transactionInputSchema = z.object({
  input: z.object({
    description: z.string().trim().min(2, 'Descreva a transação.').max(120),
    amountCents: z
      .number()
      .int('O valor deve estar em centavos.')
      .positive('O valor deve ser maior que zero.')
      .max(Number.MAX_SAFE_INTEGER),
    date: z.coerce.date({ errorMap: () => ({ message: 'Data inválida.' }) }),
    type: z.enum(TRANSACTION_TYPES, { errorMap: () => ({ message: 'Tipo inválido.' }) }),
    categoryId: z.string().optional().nullable(),
  }),
})

const idSchema = z.object({ id: z.string().min(1) })

function monthRange(year: number, month: number) {
  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lt: new Date(Date.UTC(year, month, 1)),
  }
}

async function assertOwnedCategory(ctx: Context, userId: string, categoryId?: string | null) {
  if (!categoryId) return null

  const category = await ctx.db.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  })
  if (!category) throw badRequest('Categoria não encontrada.')

  return category.id
}

export const transactionResolvers = {
  Transaction: {
    category: (transaction: Transaction, _a: unknown, ctx: Context) =>
      transaction.categoryId
        ? ctx.db.category.findUnique({ where: { id: transaction.categoryId } })
        : null,
  },

  Query: {
    transactions: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { filter, page, pageSize } = parseInput(filterSchema, args)

      const where: Prisma.TransactionWhereInput = { userId }

      if (filter?.search) where.description = { contains: filter.search }
      if (filter?.type) where.type = filter.type
      if (filter?.categoryId) where.categoryId = filter.categoryId
      if (filter?.month && filter?.year) where.date = monthRange(filter.year, filter.month)

      const [total, items] = await Promise.all([
        ctx.db.transaction.count({ where }),
        ctx.db.transaction.findMany({
          where,
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ])

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
    },

    transaction: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { id } = parseInput(idSchema, args)
      return ctx.db.transaction.findFirst({ where: { id, userId } })
    },

    summary: async (_p: unknown, args: { month?: number | null; year?: number | null }, ctx: Context) => {
      const userId = requireUser(ctx)

      const now = new Date()
      const year = args.year ?? now.getUTCFullYear()
      const month = args.month ?? now.getUTCMonth() + 1
      const period = monthRange(year, month)

      const [allTime, monthly] = await Promise.all([
        ctx.db.transaction.groupBy({ by: ['type'], where: { userId }, _sum: { amountCents: true } }),
        ctx.db.transaction.groupBy({
          by: ['type'],
          where: { userId, date: period },
          _sum: { amountCents: true },
        }),
      ])

      const sumOf = (rows: typeof allTime, type: string) =>
        rows.find((row) => row.type === type)?._sum.amountCents ?? 0

      return {
        balanceCents: sumOf(allTime, 'INCOME') - sumOf(allTime, 'EXPENSE'),
        incomeCents: sumOf(monthly, 'INCOME'),
        expenseCents: sumOf(monthly, 'EXPENSE'),
      }
    },
  },

  Mutation: {
    createTransaction: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { input } = parseInput(transactionInputSchema, args)
      const categoryId = await assertOwnedCategory(ctx, userId, input.categoryId)

      return ctx.db.transaction.create({ data: { ...input, categoryId, userId } })
    },

    updateTransaction: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { id } = parseInput(idSchema, args)
      const { input } = parseInput(transactionInputSchema, args)
      const categoryId = await assertOwnedCategory(ctx, userId, input.categoryId)

      const { count } = await ctx.db.transaction.updateMany({
        where: { id, userId },
        data: { ...input, categoryId },
      })
      if (count === 0) throw notFound('Transação não encontrada.')

      return ctx.db.transaction.findUniqueOrThrow({ where: { id } })
    },

    deleteTransaction: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { id } = parseInput(idSchema, args)

      const { count } = await ctx.db.transaction.deleteMany({ where: { id, userId } })
      if (count === 0) throw notFound('Transação não encontrada.')

      return true
    },
  },
}
