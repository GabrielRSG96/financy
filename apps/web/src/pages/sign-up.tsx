import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { LogIn, Mail, User } from 'lucide-react'
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
import { SIGN_UP } from '@/graphql/operations'
import type { AuthPayload } from '@/graphql/types'

const schema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.'),
  email: z.string().min(1, 'Informe seu e-mail.').email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
})

type FormValues = z.infer<typeof schema>

export function SignUpPage() {
  const { signIn } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) =>
      (await request<{ signUp: AuthPayload }>(SIGN_UP, values)).signUp,
    onSuccess: ({ token, user }) => {
      // Cadastro já entra logado — o usuário cai direto no dashboard.
      signIn(token, user)
      toast.success('Conta criada com sucesso!')
    },
    onError: (error: ApiError) => {
      if (error.code === 'CONFLICT') {
        form.setError('email', { message: error.message })
        return
      }

      // Erros de validação do backend voltam mapeados por campo.
      const field = Object.keys(error.fieldErrors)[0]
      if (field && field in form.getValues()) {
        form.setError(field as keyof FormValues, { message: error.fieldErrors[field] })
      } else {
        toast.error(error.message)
      }
    },
  })

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Comece a controlar suas finanças ainda hoje"
      footer={
        <div className="space-y-3 text-center">
          <p className="text-sm text-ink-soft">Já tem uma conta?</p>
          <Button asChild variant="outline" size="block">
            <Link to="/">
              <LogIn />
              Fazer login
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
          label="Nome completo"
          autoComplete="name"
          placeholder="Seu nome completo"
          icon={<User />}
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />

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
          autoComplete="new-password"
          placeholder="Digite sua senha"
          helper="A senha deve ter no mínimo 8 caracteres"
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />

        <Button type="submit" size="block" disabled={mutation.isPending}>
          {mutation.isPending ? 'Criando conta...' : 'Cadastrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
