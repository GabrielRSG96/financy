import 'dotenv/config'
import { z } from 'zod'

/**
 * Valida as variáveis de ambiente na inicialização: é melhor falhar imediatamente
 * com uma mensagem clara do que descobrir um JWT_SECRET faltando no primeiro login.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET é obrigatória — veja o .env.example'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Variáveis de ambiente inválidas:\n${issues}`)
}

export const env = {
  ...parsed.data,
  /** Lista de origens liberadas no CORS. `*` libera qualquer origem. */
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
}
