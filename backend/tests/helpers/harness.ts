import { ApolloServer } from '@apollo/server'
import { PrismaClient } from '@prisma/client'
import { copyFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createContext, type Context } from '../../src/context.js'
import { schema } from '../../src/schema.js'

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const templatePath = resolve(apiRoot, 'prisma/test-template.db')

export interface Harness {
  db: PrismaClient
  run: <T = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>,
    token?: string,
  ) => Promise<{ data: T | null | undefined; errors?: readonly { message: string; extensions?: Record<string, unknown> }[] }>
  signUp: (email: string, name?: string) => Promise<{ token: string; userId: string }>
  close: () => Promise<void>
}

export async function createHarness(name: string): Promise<Harness> {
  const dbPath = resolve(apiRoot, `prisma/test-${name}-${process.pid}.db`)
  copyFileSync(templatePath, dbPath)

  const db = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } })
  const apollo = new ApolloServer<Context>({ schema })
  await apollo.start()

  const run: Harness['run'] = async (query, variables, token) => {
    const response = await apollo.executeOperation(
      { query, variables },
      { contextValue: createContext(token ? `Bearer ${token}` : undefined, db) },
    )

    if (response.body.kind !== 'single') throw new Error('Resposta incremental não esperada')
    const result = response.body.singleResult

    return {
      data: result.data as never,
      errors: result.errors as never,
    }
  }

  const signUp: Harness['signUp'] = async (email, name = 'Usuário Teste') => {
    const { data } = await run<{ signUp: { token: string; user: { id: string } } }>(
      `mutation ($name: String!, $email: String!, $password: String!) {
        signUp(name: $name, email: $email, password: $password) { token user { id } }
      }`,
      { name, email, password: 'senha-super-secreta' },
    )
    if (!data) throw new Error(`Falha ao criar usuário ${email}`)
    return { token: data.signUp.token, userId: data.signUp.user.id }
  }

  return {
    db,
    run,
    signUp,
    close: async () => {
      await apollo.stop()
      await db.$disconnect()
      rmSync(dbPath, { force: true })
      rmSync(`${dbPath}-journal`, { force: true })
    },
  }
}

export function errorCode(errors?: readonly { extensions?: Record<string, unknown> }[]) {
  return errors?.[0]?.extensions?.code
}

export const CATEGORY_FIELDS =
  'id title description icon color transactionCount incomeCents expenseCents balanceCents'
