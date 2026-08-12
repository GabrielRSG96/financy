import type { Category } from '@prisma/client'
import { z } from 'zod'
import { requireUser, type Context } from '../../context.js'
import { conflict, notFound } from '../../lib/errors.js'
import { parseInput } from '../../lib/validation.js'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../shared/catalog.js'

const categoryInputSchema = z.object({
  input: z.object({
    title: z.string().trim().min(2, 'O título deve ter no mínimo 2 caracteres.').max(60),
    description: z
      .string()
      .trim()
      .max(200, 'A descrição deve ter no máximo 200 caracteres.')
      .optional()
      .nullable()
      // Campo opcional: string vazia vira null para não poluir o banco.
      .transform((value) => (value ? value : null)),
    icon: z.enum(CATEGORY_ICONS, { errorMap: () => ({ message: 'Ícone inválido.' }) }),
    color: z.enum(CATEGORY_COLORS, { errorMap: () => ({ message: 'Cor inválida.' }) }),
  }),
})

const idSchema = z.object({ id: z.string().min(1) })

export const categoryResolvers = {
  Category: {
    transactionCount: async (category: Category, _a: unknown, ctx: Context) =>
      (await ctx.loaders.categoryAggregates.load(category.id)).count,
    incomeCents: async (category: Category, _a: unknown, ctx: Context) =>
      (await ctx.loaders.categoryAggregates.load(category.id)).incomeCents,
    expenseCents: async (category: Category, _a: unknown, ctx: Context) =>
      (await ctx.loaders.categoryAggregates.load(category.id)).expenseCents,
    balanceCents: async (category: Category, _a: unknown, ctx: Context) =>
      (await ctx.loaders.categoryAggregates.load(category.id)).balanceCents,
  },

  Query: {
    categories: async (_p: unknown, _a: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      return ctx.db.category.findMany({ where: { userId }, orderBy: { title: 'asc' } })
    },

    category: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { id } = parseInput(idSchema, args)
      return ctx.db.category.findFirst({ where: { id, userId } })
    },

    categoryStats: async (_p: unknown, _a: unknown, ctx: Context) => {
      const userId = requireUser(ctx)

      const [totalCategories, totalTransactions, grouped] = await Promise.all([
        ctx.db.category.count({ where: { userId } }),
        ctx.db.transaction.count({ where: { userId } }),
        ctx.db.transaction.groupBy({
          by: ['categoryId'],
          where: { userId, categoryId: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { categoryId: 'desc' } },
          take: 1,
        }),
      ])

      const mostUsedId = grouped[0]?.categoryId
      const mostUsed = mostUsedId
        ? await ctx.db.category.findFirst({ where: { id: mostUsedId, userId } })
        : null

      return { totalCategories, totalTransactions, mostUsed }
    },
  },

  Mutation: {
    createCategory: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { input } = parseInput(categoryInputSchema, args)

      const duplicate = await ctx.db.category.findFirst({ where: { userId, title: input.title } })
      if (duplicate) throw conflict('Você já tem uma categoria com esse título.')

      return ctx.db.category.create({ data: { ...input, userId } })
    },

    updateCategory: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { id } = parseInput(idSchema, args)
      const { input } = parseInput(categoryInputSchema, args)

      // Existência/propriedade primeiro: uma categoria de outro usuário (ou
      // inexistente) precisa dar NOT_FOUND, e não CONFLICT por causa do título.
      const owned = await ctx.db.category.findFirst({ where: { id, userId }, select: { id: true } })
      if (!owned) throw notFound('Categoria não encontrada.')

      const duplicate = await ctx.db.category.findFirst({
        where: { userId, title: input.title, NOT: { id } },
      })
      if (duplicate) throw conflict('Você já tem uma categoria com esse título.')

      return ctx.db.category.update({ where: { id }, data: input })
    },

    deleteCategory: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { id } = parseInput(idSchema, args)

      // As transações da categoria sobrevivem com categoryId = null (onDelete: SetNull):
      // apagar uma categoria não pode apagar o histórico financeiro do usuário.
      const { count } = await ctx.db.category.deleteMany({ where: { id, userId } })
      if (count === 0) throw notFound('Categoria não encontrada.')

      return true
    },
  },
}
