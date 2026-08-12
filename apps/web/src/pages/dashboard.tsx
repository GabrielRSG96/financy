import {
  ChevronRight,
  CircleArrowDown,
  CircleArrowUp,
  Plus,
  Wallet,
  Receipt,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TransactionDialog } from '@/components/transactions/transaction-dialog'
import { CategoryIcon } from '@/components/ui/category-icon'
import { EmptyState, Skeleton } from '@/components/ui/skeleton'
import { Tag, NeutralTag } from '@/components/ui/tag'
import { TypeIndicator } from '@/components/ui/type-indicator'
import type { Category, Transaction } from '@/graphql/types'
import { useCategories } from '@/hooks/use-categories'
import { useSummary, useTransactions } from '@/hooks/use-transactions'
import { formatShortDate } from '@/lib/date'
import { formatBalance, formatCurrency, formatSignedCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const now = () => {
  const date = new Date()
  return { month: date.getMonth() + 1, year: date.getFullYear() }
}

export function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const period = now()

  const summary = useSummary(period.month, period.year)
  const recent = useTransactions({}, 1, 5)
  const categories = useCategories()

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Saldo total"
          value={summary.data?.balanceCents}
          loading={summary.isLoading}
          icon={<Wallet className="size-4 text-[#9333ea]" />}
        />
        <SummaryCard
          label="Receitas do mês"
          value={summary.data?.incomeCents}
          loading={summary.isLoading}
          icon={<CircleArrowUp className="size-4 text-income" />}
        />
        <SummaryCard
          label="Despesas do mês"
          value={summary.data?.expenseCents}
          loading={summary.isLoading}
          icon={<CircleArrowDown className="size-4 text-expense" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-xs font-medium tracking-wide text-ink-muted uppercase">
              Transações recentes
            </h2>
            <Link
              to="/transacoes"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:underline"
            >
              Ver todas
              <ChevronRight className="size-4" />
            </Link>
          </header>

          {recent.isLoading ? (
            <div className="divide-y divide-line">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-4">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : recent.data?.items.length ? (
            <ul className="divide-y divide-line">
              {recent.data.items.map((transaction) => (
                <li key={transaction.id}>
                  <RecentRow transaction={transaction} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Receipt />}
              title="Nenhuma transação ainda"
              description="Registre sua primeira entrada ou saída para acompanhar seu saldo."
            />
          )}

          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex w-full items-center justify-center gap-2 border-t border-line px-5 py-4 text-sm font-medium text-brand transition-colors hover:bg-canvas"
          >
            <Plus className="size-4" />
            Nova transação
          </button>
        </section>

        <section className="card h-fit overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-xs font-medium tracking-wide text-ink-muted uppercase">Categorias</h2>
            <Link
              to="/categorias"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:underline"
            >
              Gerenciar
              <ChevronRight className="size-4" />
            </Link>
          </header>

          {categories.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
          ) : categories.data?.length ? (
            <ul className="space-y-3 p-5">
              {categories.data
                .slice()
                .sort((a, b) => movement(b) - movement(a))
                .slice(0, 5)
                .map((category) => (
                  <li key={category.id}>
                    <CategoryRow category={category} />
                  </li>
                ))}
            </ul>
          ) : (
            <EmptyState title="Nenhuma categoria" description="Crie categorias para organizar suas transações." />
          )}
        </section>
      </div>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

function movement(category: Category): number {
  return category.incomeCents + category.expenseCents
}

function CategoryRow({ category }: { category: Category }) {
  const { balanceCents, incomeCents, expenseCents } = category
  const isMixed = incomeCents > 0 && expenseCents > 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <Tag label={category.title} color={category.color} />
        <span className="shrink-0 text-xs text-ink-muted">
          {category.transactionCount} {category.transactionCount === 1 ? 'item' : 'itens'}
        </span>
        <span
          className={cn(
            'shrink-0 text-sm font-semibold',
            balanceCents > 0 && 'text-income',
            balanceCents < 0 && 'text-expense',
            balanceCents === 0 && 'text-ink-muted',
          )}
        >
          {formatBalance(balanceCents)}
        </span>
      </div>

      {isMixed && (
        <p className="flex items-center justify-end gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <CircleArrowUp className="size-3 text-income" aria-hidden />
            <span className="sr-only">Entradas:</span>
            {formatCurrency(incomeCents)}
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleArrowDown className="size-3 text-expense" aria-hidden />
            <span className="sr-only">Saídas:</span>
            {formatCurrency(expenseCents)}
          </span>
        </p>
      )}
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value?: number
  loading: boolean
  icon: React.ReactNode
}

function SummaryCard({ label, value, loading, icon }: SummaryCardProps) {
  return (
    <article className="card p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xs font-medium tracking-wide text-ink-muted uppercase">{label}</h2>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-40" />
      ) : (
        <p className="mt-2 text-3xl font-bold text-ink">{formatCurrency(value ?? 0)}</p>
      )}
    </article>
  )
}

function RecentRow({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      {transaction.category ? (
        <CategoryIcon icon={transaction.category.icon} color={transaction.category.color} />
      ) : (
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-faint">
          <Receipt className="size-[18px]" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{transaction.description}</p>
        <p className="text-xs text-ink-muted">{formatShortDate(transaction.date)}</p>
      </div>

      <div className="hidden sm:block">
        {transaction.category ? (
          <Tag label={transaction.category.title} color={transaction.category.color} />
        ) : (
          <NeutralTag label="Sem categoria" />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            'text-sm font-semibold',
            transaction.type === 'INCOME' ? 'text-ink' : 'text-ink',
          )}
        >
          {formatSignedCurrency(transaction.amountCents, transaction.type)}
        </span>
        <TypeIndicator type={transaction.type} showLabel={false} />
      </div>
    </div>
  )
}
