import type { z } from 'zod'
import { badRequest } from './errors.js'

/**
 * Roda um schema zod sobre os argumentos do resolver e converte a falha em um
 * erro GraphQL com `code: BAD_USER_INPUT`, carregando os erros por campo para
 * que o front consiga destacar o input errado.
 */
export function parseInput<S extends z.ZodTypeAny>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value)
  if (result.success) return result.data

  const fieldErrors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    if (!fieldErrors[path]) fieldErrors[path] = issue.message
  }

  const first = result.error.issues[0]
  throw badRequest(first?.message ?? 'Dados inválidos.', { fieldErrors })
}
