/**
 * Tipos do domínio, espelhando o SDL da API (apps/api/src/modules/*//*typeDefs.ts).
 * São escritos à mão de propósito: o schema é pequeno e estável, e assim o build
 * do front não depende de um servidor rodando para gerar código.
 */

export type CategoryColor = 'GREEN' | 'BLUE' | 'PURPLE' | 'PINK' | 'RED' | 'ORANGE' | 'YELLOW'

export type TransactionType = 'INCOME' | 'EXPENSE'

export interface User {
  id: string
  name: string
  email: string
  initials: string
}

export interface AuthPayload {
  token: string
  user: User
}

export interface Category {
  id: string
  title: string
  description: string | null
  icon: string
  color: CategoryColor
  transactionCount: number
  incomeCents: number
  expenseCents: number
  /** Entradas menos saídas — negativo quando a categoria gasta mais do que recebe. */
  balanceCents: number
}

export interface Transaction {
  id: string
  description: string
  amountCents: number
  date: string
  type: TransactionType
  category: Pick<Category, 'id' | 'title' | 'icon' | 'color'> | null
}

export interface TransactionPage {
  items: Transaction[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Summary {
  balanceCents: number
  incomeCents: number
  expenseCents: number
}

export interface CategoryStats {
  totalCategories: number
  totalTransactions: number
  mostUsed: Pick<Category, 'id' | 'title' | 'icon' | 'color'> | null
}

export interface TransactionFilter {
  search?: string | null
  type?: TransactionType | null
  categoryId?: string | null
  month?: number | null
  year?: number | null
}

export interface CategoryInput {
  title: string
  description?: string | null
  icon: string
  color: CategoryColor
}

export interface TransactionInput {
  description: string
  amountCents: number
  date: string
  type: TransactionType
  categoryId?: string | null
}
