import { ClientError, GraphQLClient } from 'graphql-request'

const endpoint = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000/graphql'

const TOKEN_KEY = 'financy:token'

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token: string, remember = true) => {
    try {
      const target = remember ? localStorage : sessionStorage
      const other = remember ? sessionStorage : localStorage
      other.removeItem(TOKEN_KEY)
      target.setItem(TOKEN_KEY, token)
    } catch {
      return
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      return
    }
  },
}

const client = new GraphQLClient(endpoint)

let onUnauthenticated: (() => void) | null = null

export function setUnauthenticatedHandler(handler: () => void) {
  onUnauthenticated = handler
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined,
    readonly fieldErrors: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ClientError) {
    const first = error.response.errors?.[0]
    const extensions = (first?.extensions ?? {}) as {
      code?: string
      details?: { fieldErrors?: Record<string, string> }
    }

    return new ApiError(
      first?.message ?? 'Não foi possível concluir a operação.',
      extensions.code,
      extensions.details?.fieldErrors ?? {},
    )
  }

  return new ApiError(
    'Não foi possível conectar à API. Verifique se o servidor está no ar.',
    'NETWORK_ERROR',
    {},
  )
}

export async function request<T>(
  document: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = tokenStorage.get()

  try {
    return await client.request<T>(
      document,
      variables,
      token ? { authorization: `Bearer ${token}` } : undefined,
    )
  } catch (error) {
    const apiError = toApiError(error)
    if (apiError.code === 'UNAUTHENTICATED') onUnauthenticated?.()
    throw apiError
  }
}
