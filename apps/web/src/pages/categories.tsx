import { ArrowUpDown, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CategoryDialog } from '@/components/categories/category-dialog'
import { PageHeader } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/ui/category-icon'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { IconButton } from '@/components/ui/icon-button'
import { EmptyState, Skeleton } from '@/components/ui/skeleton'
import { Tag } from '@/components/ui/tag'
import type { ApiError } from '@/graphql/client'
import type { Category } from '@/graphql/types'
import { categoryIcon } from '@/lib/categories'
import { useCategories, useCategoryStats, useDeleteCategory } from '@/hooks/use-categories'

export function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const { data: categories = [], isLoading } = useCategories()
  const { data: stats } = useCategoryStats()
  const deleteMutation = useDeleteCategory()

  const MostUsedIcon = stats?.mostUsed ? categoryIcon(stats.mostUsed.icon) : Tags

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setDialogOpen(true)
  }

  function confirmDelete() {
    if (!deleting) return

    deleteMutation.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Categoria deletada.')
        setDeleting(null)
      },
      onError: (error: ApiError) => toast.error(error.message),
    })
  }

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Organize suas transações por categorias"
        action={
          <Button onClick={openCreate}>
            <Plus />
            Nova categoria
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Tags className="size-5 text-[#4b5563]" />}
          value={stats?.totalCategories ?? 0}
          label="Total de categorias"
        />
        <StatCard
          icon={<ArrowUpDown className="size-5 text-[#9333ea]" />}
          value={stats?.totalTransactions ?? 0}
          label="Total de transações"
        />
        <StatCard
          icon={<MostUsedIcon className="size-5 text-[#2563eb]" />}
          value={stats?.mostUsed?.title ?? '—'}
          label="Categoria mais utilizada"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Tags />}
            title="Nenhuma categoria ainda"
            description="Crie categorias para organizar suas transações por tipo de gasto ou receita."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus />
                Nova categoria
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id} className="card flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <CategoryIcon icon={category.icon} color={category.color} />
                <div className="flex gap-2">
                  <IconButton
                    tone="danger"
                    label={`Deletar ${category.title}`}
                    onClick={() => setDeleting(category)}
                  >
                    <Trash2 />
                  </IconButton>
                  <IconButton label={`Editar ${category.title}`} onClick={() => openEdit(category)}>
                    <Pencil />
                  </IconButton>
                </div>
              </div>

              <h2 className="mt-3 font-semibold text-ink">{category.title}</h2>
              <p className="mt-0.5 flex-1 text-sm text-ink-muted">
                {category.description || 'Sem descrição'}
              </p>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Tag label={category.title} color={category.color} />
                <span className="shrink-0 text-xs text-ink-muted">
                  {category.transactionCount} {category.transactionCount === 1 ? 'item' : 'itens'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Deletar categoria"
        description={
          <>
            A categoria <strong className="text-ink">{deleting?.title}</strong> será removida.
            {deleting && deleting.transactionCount > 0 ? (
              <>
                {' '}
                Suas <strong className="text-ink">{deleting.transactionCount}</strong>{' '}
                {deleting.transactionCount === 1 ? 'transação' : 'transações'} serão mantidas, mas
                ficarão sem categoria.
              </>
            ) : null}
          </>
        }
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <article className="card flex items-center gap-4 p-5">
      {icon}
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold text-ink">{value}</p>
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">{label}</p>
      </div>
    </article>
  )
}
