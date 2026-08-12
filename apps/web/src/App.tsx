import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { Logo } from '@/components/brand/logo'
import { useAuth } from '@/contexts/auth'
import { CategoriesPage } from '@/pages/categories'
import { DashboardPage } from '@/pages/dashboard'
import { LoginPage } from '@/pages/login'
import { ProfilePage } from '@/pages/profile'
import { SignUpPage } from '@/pages/sign-up'
import { TransactionsPage } from '@/pages/transactions'

/** Splash curto enquanto o token salvo é validado — evita piscar a tela de login. */
function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Logo className="animate-pulse" />
    </div>
  )
}

/** Rotas privadas: sem sessão, volta para a raiz (que renderiza o login). */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <BootScreen />
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

/** Telas de autenticação: com sessão ativa, não faz sentido exibi-las. */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <BootScreen />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

/**
 * A raiz é dupla, como pede o desafio: login para quem está deslogado,
 * dashboard para quem está logado.
 */
function RootRoute() {
  const { user, loading } = useAuth()

  if (loading) return <BootScreen />
  if (!user) return <LoginPage />

  return (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />

      <Route
        path="/cadastro"
        element={
          <GuestRoute>
            <SignUpPage />
          </GuestRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/transacoes" element={<TransactionsPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
