import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Mail, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthShell } from '@/components/auth/auth-shell'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { useAuth } from '@/contexts/auth'
import { ApiError, request } from '@/graphql/client'
import { SIGN_IN } from '@/graphql/operations'
import type { AuthPayload } from '@/graphql/types'

const schema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe sua senha.'),
  remember: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { signIn } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const mutation = useMutation({
    mutationFn: async ({ email, password }: FormValues) =>
      (await request<{ signIn: AuthPayload }>(SIGN_IN, { email, password })).signIn,
    onSuccess: ({ token, user }) => {
      signIn(token, user, form.getValues('remember'))
      toast.success(`Bem-vindo de volta, ${user.name.split(' ')[0]}!`)
    },
    onError: (error: ApiError) => {
      // Credenciais erradas viram erro no campo; o resto vira toast.
      if (error.code === 'UNAUTHENTICATED') {
        form.setError('password', { message: error.message })
      } else {
        toast.error(error.message)
      }
    },
  })

  return (
    <AuthShell
      title="Fazer login"
      subtitle="Entre na sua conta para continuar"
      footer={
        <div className="space-y-3 text-center">
          <p className="text-sm text-ink-soft">Ainda não tem uma conta?</p>
          <Button asChild variant="outline" size="block">
            <Link to="/cadastro">
              <UserPlus />
              Criar conta
            </Link>
          </Button>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="mail@exemplo.com"
          icon={<Mail />}
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />

        <PasswordInput
          label="Senha"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              className="size-4 cursor-pointer rounded border-line-strong accent-brand"
              {...form.register('remember')}
            />
            Lembrar-me
          </label>

          <button
            type="button"
            className="text-sm text-brand transition-colors hover:underline"
            onClick={() =>
              toast.info('Recuperação de senha não faz parte desta versão do Financy.')
            }
          >
            Recuperar senha
          </button>
        </div>

        <Button type="submit" size="block" disabled={mutation.isPending}>
          {mutation.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
