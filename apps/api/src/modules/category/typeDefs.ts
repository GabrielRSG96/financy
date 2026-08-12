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
    "Soma dos valores (em centavos) das transações desta categoria"
    totalCents: Int!
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
