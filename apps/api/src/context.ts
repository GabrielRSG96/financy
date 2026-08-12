import type { IncomingMessage } from 'node:http'
import { userIdFromAuthHeader } from './lib/auth.js'
import { unauthenticated } from './lib/errors.js'
import { createLoaders, type Loaders } from './lib/loaders.js'
import { prisma, type Db } from './lib/prisma.js'

export interface Context {
  db: Db
  userId: string | null
  loaders: Loaders
}

export function createContext(authHeader: string | undefined, db: Db = prisma): Context {
  const userId = userIdFromAuthHeader(authHeader)
  return { db, userId, loaders: createLoaders(db, userId) }
}

export function contextFromRequest(req: IncomingMessage): Context {
  return createContext(req.headers.authorization)
}

/**
 * Porta de entrada de toda operação autenticada. Devolve o id do usuário logado
 * para que os resolvers sempre filtrem os dados por dono — a regra central do app.
 */
export function requireUser(ctx: Context): string {
  if (!ctx.userId) throw unauthenticated()
  return ctx.userId
}
