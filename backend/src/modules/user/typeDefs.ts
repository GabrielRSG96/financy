export const userTypeDefs = `
  scalar DateTime

  type User {
    id: ID!
    name: String!
    email: String!
    "Iniciais exibidas no avatar (ex.: 'Conta teste' -> 'CT')"
    initials: String!
    "URL absoluta da foto de perfil, ou null quando o usuário não enviou nenhuma"
    avatarUrl: String
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
    "Envia a foto de perfil como data URL em base64 (PNG, JPEG ou WebP, até 2 MB)."
    updateAvatar(image: String!): User!
    removeAvatar: User!
  }
`
