import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { LogOut, Mail, User as UserIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AvatarUploader } from '@/components/profile/avatar-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { useAuth } from '@/contexts/auth'
import { ApiError, request } from '@/graphql/client'
import { UPDATE_PROFILE } from '@/graphql/operations'
import type { User } from '@/graphql/types'

const schema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.'),
})

type FormValues = z.infer<typeof schema>

export function ProfilePage() {
  const { user, setUser, signOut } = useAuth()
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '' },
  })

  useEffect(() => {
    if (user) form.reset({ name: user.name })
  }, [user, form])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) =>
      (await request<{ updateProfile: User }>(UPDATE_PROFILE, values)).updateProfile,
    onSuccess: (updated) => {
      setUser(updated)
      form.reset({ name: updated.name })
      toast.success('Perfil atualizado!')
    },
    onError: (error: ApiError) => {
      const message = error.fieldErrors.name ?? error.message
      form.setError('name', { message })
    },
  })

  function handleSignOut() {
    signOut()
    navigate('/', { replace: true })
    toast.success('Você saiu da sua conta.')
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <AvatarUploader user={user} />
          <div>
            <h1 className="font-semibold text-ink">{user.name}</h1>
            <p className="text-sm text-ink-muted">{user.email}</p>
          </div>
        </div>

        <hr className="my-6 border-line" />

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <Input
            label="Nome completo"
            autoComplete="name"
            icon={<UserIcon />}
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />

          <Input
            label="E-mail"
            value={user.email}
            icon={<Mail />}
            helper="O e-mail não pode ser alterado"
            disabled
            readOnly
          />

          <Button type="submit" size="block" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>

          <Button type="button" variant="outline" size="block" onClick={handleSignOut}>
            <LogOut className="text-expense" />
            Sair da conta
          </Button>
        </form>
      </div>
    </div>
  )
}
