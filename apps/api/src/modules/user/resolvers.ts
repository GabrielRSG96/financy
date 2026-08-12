import type { User } from '@prisma/client'
import { z } from 'zod'
import { requireUser, type Context } from '../../context.js'
import { hashPassword, signToken, verifyPassword } from '../../lib/auth.js'
import { badRequest, conflict, unauthenticated } from '../../lib/errors.js'
import { parseInput } from '../../lib/validation.js'

const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.').max(128),
})

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
})

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const userResolvers = {
  User: {
    initials: (user: User) => initials(user.name),
  },

  Query: {
    me: async (_p: unknown, _a: unknown, ctx: Context) => {
      if (!ctx.userId) return null
      return ctx.db.user.findUnique({ where: { id: ctx.userId } })
    },
  },

  Mutation: {
    signUp: async (_p: unknown, args: unknown, ctx: Context) => {
      const { name, email, password } = parseInput(signUpSchema, args)

      const existing = await ctx.db.user.findUnique({ where: { email } })
      if (existing) throw conflict('Já existe uma conta com esse e-mail.')

      const user = await ctx.db.user.create({
        data: { name, email, passwordHash: await hashPassword(password) },
      })

      return { token: signToken(user.id), user }
    },

    signIn: async (_p: unknown, args: unknown, ctx: Context) => {
      const { email, password } = parseInput(signInSchema, args)

      const user = await ctx.db.user.findUnique({ where: { email } })
      const invalid = unauthenticated('E-mail ou senha incorretos.')
      if (!user) throw invalid
      if (!(await verifyPassword(password, user.passwordHash))) throw invalid

      return { token: signToken(user.id), user }
    },

    updateProfile: async (_p: unknown, args: unknown, ctx: Context) => {
      const userId = requireUser(ctx)
      const { name } = parseInput(updateProfileSchema, args)

      try {
        return await ctx.db.user.update({ where: { id: userId }, data: { name } })
      } catch {
        throw badRequest('Não foi possível atualizar o perfil.')
      }
    },
  },
}
