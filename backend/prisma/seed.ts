import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_EMAIL = 'conta@teste.com'
const DEMO_PASSWORD = 'financy123'

const categories = [
  { title: 'Alimentação', description: 'Restaurantes, delivery e refeições', icon: 'utensils', color: 'BLUE' },
  { title: 'Entretenimento', description: 'Cinema, jogos e lazer', icon: 'ticket', color: 'PINK' },
  { title: 'Investimento', description: 'Aplicações e retornos financeiros', icon: 'leaf', color: 'GREEN' },
  { title: 'Mercado', description: 'Compras de supermercado e mantimentos', icon: 'shopping-cart', color: 'ORANGE' },
  { title: 'Salário', description: 'Renda mensal e bonificações', icon: 'briefcase', color: 'GREEN' },
  { title: 'Saúde', description: 'Medicamentos, consultas e exames', icon: 'heart-pulse', color: 'RED' },
  { title: 'Transporte', description: 'Gasolina, transporte público e viagens', icon: 'car', color: 'PURPLE' },
  { title: 'Utilidades', description: 'Energia, água, internet e telefone', icon: 'file-text', color: 'YELLOW' },
] as const

const today = new Date()

function day(monthsAgo: number, dayOfMonth: number): Date {
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth() - monthsAgo
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month, Math.min(dayOfMonth, lastDay)))
}

const transactions = [
  { description: 'Pagamento de Salário', amountCents: 425_000, date: day(0, 1), type: 'INCOME', category: 'Salário' },
  { description: 'Jantar no Restaurante', amountCents: 8_950, date: day(0, 3), type: 'EXPENSE', category: 'Alimentação' },
  { description: 'Posto de Gasolina', amountCents: 10_000, date: day(0, 4), type: 'EXPENSE', category: 'Transporte' },
  { description: 'Compras no Mercado', amountCents: 15_680, date: day(0, 5), type: 'EXPENSE', category: 'Mercado' },
  { description: 'Retorno de Investimento', amountCents: 34_025, date: day(0, 7), type: 'INCOME', category: 'Investimento' },
  { description: 'Aluguel', amountCents: 170_000, date: day(0, 8), type: 'EXPENSE', category: 'Utilidades' },
  { description: 'Compras Jantar', amountCents: 15_000, date: day(0, 10), type: 'EXPENSE', category: 'Mercado' },
  { description: 'Cinema', amountCents: 8_800, date: day(0, 12), type: 'EXPENSE', category: 'Entretenimento' },
  { description: 'Conta de Energia', amountCents: 24_580, date: day(0, 15), type: 'EXPENSE', category: 'Utilidades' },
  { description: 'Almoço no trabalho', amountCents: 4_200, date: day(0, 18), type: 'EXPENSE', category: 'Alimentação' },

  { description: 'Freelance', amountCents: 250_000, date: day(1, 24), type: 'INCOME', category: 'Salário' },
  { description: 'Uber para o trabalho', amountCents: 3_250, date: day(1, 14), type: 'EXPENSE', category: 'Transporte' },
  { description: 'Internet fibra', amountCents: 12_990, date: day(1, 10), type: 'EXPENSE', category: 'Utilidades' },
  { description: 'Feira da semana', amountCents: 9_820, date: day(1, 8), type: 'EXPENSE', category: 'Mercado' },
  { description: 'Streaming de música', amountCents: 2_190, date: day(1, 5), type: 'EXPENSE', category: 'Entretenimento' },
  { description: 'Delivery de pizza', amountCents: 7_450, date: day(1, 3), type: 'EXPENSE', category: 'Alimentação' },
  { description: 'Bonificação trimestral', amountCents: 120_000, date: day(1, 2), type: 'INCOME', category: 'Salário' },

  { description: 'Estacionamento', amountCents: 2_500, date: day(2, 28), type: 'EXPENSE', category: 'Transporte' },
] as const

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { name: 'Conta teste', email: DEMO_EMAIL, passwordHash },
  })

  await prisma.transaction.deleteMany({ where: { userId: user.id } })
  await prisma.category.deleteMany({ where: { userId: user.id } })

  const created = new Map<string, string>()
  for (const category of categories) {
    const record = await prisma.category.create({ data: { ...category, userId: user.id } })
    created.set(record.title, record.id)
  }

  for (const transaction of transactions) {
    const { category, ...rest } = transaction
    await prisma.transaction.create({
      data: { ...rest, categoryId: created.get(category) ?? null, userId: user.id },
    })
  }

  console.log(`✅ Seed concluído: ${categories.length} categorias e ${transactions.length} transações.`)
  console.log(`   Login de demonstração: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error('Falha ao rodar o seed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
