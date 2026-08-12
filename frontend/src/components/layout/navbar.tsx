import { NavLink, Link } from 'react-router-dom'
import { Logo } from '@/components/brand/logo'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transacoes', label: 'Transações', end: false },
  { to: '/categorias', label: 'Categorias', end: false },
]

export function Navbar() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="Financy — ir para o dashboard">
          <Logo />
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6" aria-label="Navegação principal">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'text-sm transition-colors',
                  isActive ? 'font-medium text-brand' : 'text-ink-soft hover:text-ink',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/perfil"
          className="rounded-full transition-opacity hover:opacity-80"
          aria-label={`Perfil de ${user?.name ?? 'usuário'}`}
        >
          <Avatar initials={user?.initials ?? '?'} src={user?.avatarUrl} />
        </Link>
      </div>
    </header>
  )
}
