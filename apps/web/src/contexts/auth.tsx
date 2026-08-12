import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { request, setUnauthenticatedHandler, tokenStorage } from '@/graphql/client'
import { ME } from '@/graphql/operations'
import type { User } from '@/graphql/types'

interface AuthContextValue {
  user: User | null
  /** true enquanto a sessão salva no localStorage ainda está sendo validada. */
  loading: boolean
  signIn: (token: string, user: User, remember?: boolean) => void
  signOut: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    // Sem isso, os dados do usuário anterior ficariam em cache para o próximo login.
    queryClient.clear()
  }, [queryClient])

  const signIn = useCallback((token: string, nextUser: User, remember = true) => {
    tokenStorage.set(token, remember)
    setUser(nextUser)
  }, [])

  // Qualquer resposta UNAUTHENTICATED (token expirado, por exemplo) derruba a sessão.
  useEffect(() => {
    setUnauthenticatedHandler(() => {
      tokenStorage.clear()
      setUser(null)
    })
  }, [])

  // Hidrata a sessão ao abrir o app: o token salvo pode ter expirado.
  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      if (!tokenStorage.get()) {
        setLoading(false)
        return
      }

      try {
        const data = await request<{ me: User | null }>(ME)
        if (cancelled) return
        if (data.me) setUser(data.me)
        else tokenStorage.clear()
      } catch {
        if (!cancelled) tokenStorage.clear()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, setUser }),
    [user, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return context
}
