export const userTypeDefs = /* GraphQL */ `
  scalar DateTime

  type User {
    id: ID!
    name: String!
    email: String!
    "Iniciais exibidas no avatar (ex.: 'Conta teste' -> 'CT')"
    initials: String!
    createdAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    "Usuário autenticado, ou null quando não há sessão válida."
    me: User
  }

  type Mutation {
    signUp(name: String!, email: String!, password: String!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
    updateProfile(name: String!): User!
  }
`
