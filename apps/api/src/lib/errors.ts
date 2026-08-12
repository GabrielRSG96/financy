import { GraphQLError } from 'graphql'

export function unauthenticated(message = 'Você precisa estar autenticado.') {
  return new GraphQLError(message, { extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } } })
}

export function badRequest(message: string, details?: unknown) {
  return new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT', details, http: { status: 400 } },
  })
}

export function notFound(message = 'Registro não encontrado.') {
  return new GraphQLError(message, { extensions: { code: 'NOT_FOUND', http: { status: 404 } } })
}

export function conflict(message: string) {
  return new GraphQLError(message, { extensions: { code: 'CONFLICT', http: { status: 409 } } })
}
