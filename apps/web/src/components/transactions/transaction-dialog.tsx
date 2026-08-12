import { zodResolver } from '@hookform/resolvers/zod'
import { CircleArrowDown, CircleArrowUp } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FieldShell, Input } from '@/components/ui/field'
import { SelectField, SelectItem } from '@/components/ui/select'
import type { ApiError } from '@/graphql/client'
import type { Transaction, TransactionType } from '@/graphql/types'
import { useCategories } from '@/hooks/use-categories'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/use-transactions'
import { formatAmount, maskAmount, parseAmountToCents } from '@/lib/format'
import { fromUtcIso, toUtcIso } from '@/lib/date'
import { cn } from '@/lib/utils'

const NO_CATEGORY = '__none__'

const schema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().trim().min(2, 'Descreva a transação.').max(120),
  date: z.string().min(1, 'Selecione a data.'),
  amount: z.string().refine((value) => parseAmountToCents(value) > 0, 'Informe um valor maior que zero.'),
  categoryId: z.string(),
})

type FormValues = z.infer<typeof schema>

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
}

function todayInputValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function toInputValue(iso: string): string {
  const date = fromUtcIso(iso)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function TransactionDialog({ open, onOpenChange, transaction }: TransactionDialogProps) {
  const isEditing = Boolean(transaction)
  const { data: categories = [] } = useCategories(open)
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const mutation = isEditing ? updateMutation : createMutation

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'EXPENSE',
      description: '',
      date: todayInputValue(),
      amount: '0,00',
      categoryId: NO_CATEGORY,
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset(
      transaction
        ? {
            type: transaction.type,
            description: transaction.description,
            date: toInputValue(transaction.date),
            amount: formatAmount(transaction.amountCents),
            categoryId: transaction.category?.id ?? NO_CATEGORY,
          }
        : {
            type: 'EXPENSE',
            description: '',
            date: todayInputValue(),
            amount: '0,00',
            categoryId: NO_CATEGORY,
          },
    )
  }, [open, transaction, form])

  const type = form.watch('type')

  function onSubmit(values: FormValues) {
    const [year, month, day] = values.date.split('-').map(Number)

    const input = {
      description: values.description.trim(),
      amountCents: parseAmountToCents(values.amount),
      date: toUtcIso(new Date(year, month - 1, day)),
      type: values.type,
      categoryId: values.categoryId === NO_CATEGORY ? null : values.categoryId,
    }

    const onSuccess = () => {
      toast.success(isEditing ? 'Transação atualizada!' : 'Transação criada!')
      onOpenChange(false)
    }
    const onError = (error: ApiError) => toast.error(error.message)

    if (isEditing && transaction) {
      updateMutation.mutate({ id: transaction.id, input }, { onSuccess, onError })
    } else {
      createMutation.mutate(input, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Editar transação' : 'Nova transação'}
        description="Registre sua despesa ou receita"
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <TypeToggle value={type} onChange={(next) => form.setValue('type', next)} />

          <Input
            label="Descrição"
            placeholder="Ex. Almoço no restaurante"
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data"
              type="date"
              error={form.formState.errors.date?.message}
              {...form.register('date')}
            />

            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Input
                  label="Valor"
                  inputMode="numeric"
                  placeholder="0,00"
                  icon={<span className="text-sm text-ink-muted">R$</span>}
                  error={fieldState.error?.message}
                  value={field.value}
                  onChange={(event) => field.onChange(maskAmount(event.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <SelectField
                label="Categoria"
                placeholder="Selecione"
                value={field.value}
                onValueChange={field.onChange}
                error={fieldState.error?.message}
              >
                <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.title}
                  </SelectItem>
                ))}
              </SelectField>
            )}
          />

          <Button type="submit" size="block" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface TypeToggleProps {
  value: TransactionType
  onChange: (value: TransactionType) => void
}

function TypeToggle({ value, onChange }: TypeToggleProps) {
  const options = [
    { type: 'EXPENSE' as const, label: 'Despesa', Icon: CircleArrowDown, active: 'border-expense text-expense bg-expense/5' },
    { type: 'INCOME' as const, label: 'Receita', Icon: CircleArrowUp, active: 'border-income text-income bg-income/5' },
  ]

  return (
    <FieldShell>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo da transação">
        {options.map(({ type, label, Icon, active }) => (
          <button
            key={type}
            type="button"
            aria-pressed={value === type}
            onClick={() => onChange(type)}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
              value === type ? active : 'border-line bg-surface text-ink-muted hover:bg-canvas',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </FieldShell>
  )
}
