import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FieldShell, Input } from '@/components/ui/field'
import type { ApiError } from '@/graphql/client'
import type { Category, CategoryColor } from '@/graphql/types'
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories'
import { CATEGORY_COLORS, CATEGORY_ICONS, categoryIcon, COLOR_SWATCH } from '@/lib/categories'
import { cn } from '@/lib/utils'

const schema = z.object({
  title: z.string().trim().min(2, 'O título deve ter no mínimo 2 caracteres.').max(60),
  description: z.string().trim().max(200, 'Máximo de 200 caracteres.'),
  icon: z.string().min(1),
  color: z.enum(['GREEN', 'BLUE', 'PURPLE', 'PINK', 'RED', 'ORANGE', 'YELLOW']),
})

type FormValues = z.infer<typeof schema>

const DEFAULTS: FormValues = {
  title: '',
  description: '',
  icon: CATEGORY_ICONS[0],
  color: 'GREEN',
}

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const isEditing = Boolean(category)
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const mutation = isEditing ? updateMutation : createMutation

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS })

  useEffect(() => {
    if (!open) return

    form.reset(
      category
        ? {
            title: category.title,
            description: category.description ?? '',
            icon: category.icon,
            color: category.color,
          }
        : DEFAULTS,
    )
  }, [open, category, form])

  function onSubmit(values: FormValues) {
    const input = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      icon: values.icon,
      color: values.color,
    }

    const onSuccess = () => {
      toast.success(isEditing ? 'Categoria atualizada!' : 'Categoria criada!')
      onOpenChange(false)
    }

    const onError = (error: ApiError) => {
      if (error.code === 'CONFLICT') form.setError('title', { message: error.message })
      else toast.error(error.message)
    }

    if (isEditing && category) {
      updateMutation.mutate({ id: category.id, input }, { onSuccess, onError })
    } else {
      createMutation.mutate(input, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Editar categoria' : 'Nova categoria'}
        description="Organize suas transações com categorias"
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Input
            label="Título"
            placeholder="Ex. Alimentação"
            error={form.formState.errors.title?.message}
            {...form.register('title')}
          />

          <Input
            label="Descrição"
            placeholder="Descrição da categoria"
            helper="Opcional"
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />

          <Controller
            control={form.control}
            name="icon"
            render={({ field }) => (
              <IconPicker value={field.value} onChange={field.onChange} color={form.watch('color')} />
            )}
          />

          <Controller
            control={form.control}
            name="color"
            render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
          />

          <Button type="submit" size="block" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
  color: CategoryColor
}

function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <FieldShell label="Ícone">
      <div className="grid grid-cols-8 gap-2" role="radiogroup" aria-label="Ícone da categoria">
        {CATEGORY_ICONS.map((name) => {
          const Icon = categoryIcon(name)
          const selected = value === name

          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={name}
              onClick={() => onChange(name)}
              style={selected ? { color: COLOR_SWATCH[color], borderColor: COLOR_SWATCH[color] } : undefined}
              className={cn(
                'inline-flex aspect-square items-center justify-center rounded-lg border transition-colors',
                selected ? 'bg-canvas' : 'border-line text-ink-muted hover:bg-canvas hover:text-ink',
              )}
            >
              <Icon className="size-4" />
            </button>
          )
        })}
      </div>
    </FieldShell>
  )
}

interface ColorPickerProps {
  value: CategoryColor
  onChange: (value: CategoryColor) => void
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <FieldShell label="Cor">
      <div className="grid grid-cols-7 gap-2" role="radiogroup" aria-label="Cor da categoria">
        {CATEGORY_COLORS.map((color) => {
          const selected = value === color

          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color}
              onClick={() => onChange(color)}
              style={{ backgroundColor: COLOR_SWATCH[color] }}
              className={cn(
                'inline-flex h-8 items-center justify-center rounded-md text-white transition-transform',
                selected && 'ring-2 ring-ink/60 ring-offset-2',
              )}
            >
              {selected && <Check className="size-4" />}
            </button>
          )
        })}
      </div>
    </FieldShell>
  )
}
