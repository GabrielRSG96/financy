import { Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/app-layout'
import { TransactionDialog } from '@/components/transactions/transaction-dialog'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/ui/category-icon'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/field'
import { IconButton } from '@/components/ui/icon-button'
import { Pagination } from '@/components/ui/pagination'
import { SelectField, SelectItem } from '@/components/ui/select'
import { EmptyState, Skeleton } from '@/components/ui/skeleton'
import { NeutralTag, Tag } from '@/components/ui/tag'
import { TypeIndicator } from '@/components/ui/type-indicator'
import type { ApiError } from '@/graphql/client'
import type { Transaction, TransactionFilter } from '@/graphql/types'
import { useCategories } from '@/hooks/use-categories'
import { useDeleteTransaction, useTransactions } from '@/hooks/use-transactions'
import { formatShortDate, recentPeriods } from '@/lib/date'
import { formatSignedCurrency } from '@/lib/format'

const PAGE_SIZE = 10
const ALL = '__all__'

export function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [type, setType] = useState<string>(ALL)
  const [categoryId, setCategoryId] = useState<string>(ALL)
  const [period, setPeriod] = useState<string>(ALL)
  const [page, setPage] = useState(1)

  const [editing, setEditing] = useState<Transaction | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const periods = useMemo(() => recentPeriods(), [])
  const { data: categories = [] } = useCategories()
  const deleteMutation = useDeleteTransaction()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, type, categoryId, period])

  const filter: TransactionFilter = {
    search: debouncedSearch || null,
    type: type === ALL ? null : (type as TransactionFilter['type']),
    categoryId: categoryId === ALL ? null : categoryId,
    ...(period === ALL
      ? {}
      : { month: Number(period.split('-')[1]), year: Number(period.split('-')[0]) }),
  }

  const { data, isLoading, isPlaceholderData } = useTransactions(filter, page, PAGE_SIZE)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const firstOnPage = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastOnPage = Math.min(page * PAGE_SIZE, total)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction)
    setDialogOpen(true)
  }

  function confirmDelete() {
    if (!deleting) return

    deleteMutation.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Transação deletada.')
        setDeleting(null)
        if (items.length === 1 && page > 1) setPage(page - 1)
      },
      onError: (error: ApiError) => toast.error(error.message),
    })
  }

  return (
    <>
      <PageHeader
        title="Transações"
        description="Gerencie todas as suas transações financeiras"
        action={
          <Button onClick={openCreate}>
            <Plus />
            Nova transação
          </Button>
        }
      />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Buscar"
          placeholder="Buscar por descrição"
          icon={<Search />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <SelectField label="Tipo" value={type} onValueChange={setType}>
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="INCOME">Entrada</SelectItem>
          <SelectItem value="EXPENSE">Saída</SelectItem>
        </SelectField>

        <SelectField label="Categoria" value={categoryId} onValueChange={setCategoryId}>
          <SelectItem value={ALL}>Todas</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.title}
            </SelectItem>
          ))}
        </SelectField>

        <SelectField label="Período" value={period} onValueChange={setPeriod}>
          <SelectItem value={ALL}>Todo o período</SelectItem>
          {periods.map((item) => (
            <SelectItem key={`${item.year}-${item.month}`} value={`${item.year}-${item.month}`}>
              {item.label}
            </SelectItem>
          ))}
        </SelectField>
      </div>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Descrição', 'Data', 'Categoria', 'Tipo', 'Valor', 'Ações'].map((heading, index) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-xs font-medium tracking-wide text-ink-muted uppercase"
                    style={{ textAlign: index >= 4 ? 'right' : 'left' }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-line last:border-0">
                    <td colSpan={6} className="px-4 py-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Receipt />}
                      title="Nenhuma transação encontrada"
                      description="Ajuste os filtros ou registre uma nova transação."
                      action={
                        <Button size="sm" onClick={openCreate}>
                          <Plus />
                          Nova transação
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {transaction.category ? (
                          <CategoryIcon
                            icon={transaction.category.icon}
                            color={transaction.category.color}
                            size="sm"
                          />
                        ) : (
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-faint">
                            <Receipt className="size-4" />
                          </span>
                        )}
                        <span className="text-sm font-medium text-ink">{transaction.description}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-ink-soft">
                      {formatShortDate(transaction.date)}
                    </td>

                    <td className="px-4 py-3">
                      {transaction.category ? (
                        <Tag label={transaction.category.title} color={transaction.category.color} />
                      ) : (
                        <NeutralTag label="Sem categoria" />
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <TypeIndicator type={transaction.type} />
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                      {formatSignedCurrency(transaction.amountCents, transaction.type)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          tone="danger"
                          label={`Deletar ${transaction.description}`}
                          onClick={() => setDeleting(transaction)}
                        >
                          <Trash2 />
                        </IconButton>
                        <IconButton
                          label={`Editar ${transaction.description}`}
                          onClick={() => openEdit(transaction)}
                        >
                          <Pencil />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-xs text-ink-muted">
              {firstOnPage} a {lastOnPage} | {total} {total === 1 ? 'resultado' : 'resultados'}
            </p>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
          </footer>
        )}
      </section>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} transaction={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Deletar transação"
        description={
          <>
            A transação <strong className="text-ink">{deleting?.description}</strong> será removida
            permanentemente. Essa ação não pode ser desfeita.
          </>
        }
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}
