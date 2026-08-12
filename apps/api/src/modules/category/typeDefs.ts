export const categoryTypeDefs = /* GraphQL */ `
  enum CategoryColor {
    GREEN
    BLUE
    PURPLE
    PINK
    RED
    ORANGE
    YELLOW
  }

  type Category {
    id: ID!
    title: String!
    description: String
    "Nome do ícone Lucide"
    icon: String!
    color: CategoryColor!
    "Quantidade de transações do usuário nesta categoria"
    transactionCount: Int!
    "Soma das entradas desta categoria, em centavos"
    incomeCents: Int!
    "Soma das saídas desta categoria, em centavos (valor positivo)"
    expenseCents: Int!
    "Entradas menos saídas, em centavos. Negativo quando a categoria gasta mais do que recebe."
    balanceCents: Int!
    createdAt: DateTime!
  }

  type CategoryStats {
    totalCategories: Int!
    totalTransactions: Int!
    "Categoria com mais transações, ou null quando ainda não há nenhuma"
    mostUsed: Category
  }

  input CategoryInput {
    title: String!
    description: String
    icon: String!
    color: CategoryColor!
  }

  extend type Query {
    categories: [Category!]!
    category(id: ID!): Category
    categoryStats: CategoryStats!
  }

  extend type Mutation {
    createCategory(input: CategoryInput!): Category!
    updateCategory(id: ID!, input: CategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
  }
`
