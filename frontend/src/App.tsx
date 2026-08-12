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

function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Logo className="animate-pulse" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <BootScreen />
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <BootScreen />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

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
