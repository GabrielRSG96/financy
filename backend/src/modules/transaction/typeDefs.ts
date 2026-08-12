export const transactionTypeDefs = `
  enum TransactionType {
    INCOME
    EXPENSE
  }

  type Transaction {
    id: ID!
    description: String!
    "Valor absoluto em centavos — o sinal é dado por 'type'"
    amountCents: Int!
    date: DateTime!
    type: TransactionType!
    category: Category
    createdAt: DateTime!
  }

  type TransactionPage {
    items: [Transaction!]!
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }

  type Summary {
    balanceCents: Int!
    incomeCents: Int!
    expenseCents: Int!
  }

  input TransactionFilter {
    "Busca por trecho da descrição"
    search: String
    type: TransactionType
    categoryId: ID
    "Mês (1-12); usado junto com 'year' para filtrar por período"
    month: Int
    year: Int
  }

  input TransactionInput {
    description: String!
    amountCents: Int!
    date: DateTime!
    type: TransactionType!
    categoryId: ID
  }

  extend type Query {
    transactions(filter: TransactionFilter, page: Int = 1, pageSize: Int = 10): TransactionPage!
    transaction(id: ID!): Transaction
    """
    Saldo total (todas as transações) e entradas/saídas do mês informado.
    Sem mês/ano, usa o mês corrente.
    """
    summary(month: Int, year: Int): Summary!
  }

  extend type Mutation {
    createTransaction(input: TransactionInput!): Transaction!
    updateTransaction(id: ID!, input: TransactionInput!): Transaction!
    deleteTransaction(id: ID!): Boolean!
  }
`
