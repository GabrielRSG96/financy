import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import cors from 'cors'
import express from 'express'
import { contextFromRequest, type Context } from './context.js'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'
import { schema } from './schema.js'

async function main() {
  const app = express()

  const apollo = new ApolloServer<Context>({
    schema,
    includeStacktraceInErrorResponses: env.NODE_ENV !== 'production',
  })

  await apollo.start()

  const allowAll = env.corsOrigins.includes('*')
  const corsOptions: cors.CorsOptions = {
    origin: allowAll ? true : env.corsOrigins,
    credentials: true,
  }

  app.use(cors(corsOptions))
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use(
    '/graphql',
    express.json({ limit: '1mb' }),
    expressMiddleware(apollo, {
      context: async ({ req }) => contextFromRequest(req),
    }),
  )

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Financy API em http://localhost:${env.PORT}/graphql`)
    console.log(`   CORS liberado para: ${env.corsOrigins.join(', ')}`)
  })

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} recebido, encerrando...`)
    server.close()
    await apollo.stop()
    await prisma.$disconnect()
    process.exit(0)
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

main().catch((error) => {
  console.error('Falha ao iniciar a API:', error)
  process.exit(1)
})
