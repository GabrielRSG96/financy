import { useMutation } from '@tanstack/react-query'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth'
import { ApiError, request } from '@/graphql/client'
import { REMOVE_AVATAR, UPDATE_AVATAR } from '@/graphql/operations'
import type { User } from '@/graphql/types'
import { ACCEPT_ATTRIBUTE, fileToAvatarDataUrl, validateImageFile } from '@/lib/image'

export function AvatarUploader({ user }: { user: User }) {
  const { setUser } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const upload = useMutation<User, ApiError, string>({
    mutationFn: async (image) =>
      (await request<{ updateAvatar: User }>(UPDATE_AVATAR, { image })).updateAvatar,
    onSuccess: (updated) => {
      setUser(updated)
      toast.success('Foto de perfil atualizada!')
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setPreview(null),
  })

  const remove = useMutation<User, ApiError, void>({
    mutationFn: async () => (await request<{ removeAvatar: User }>(REMOVE_AVATAR)).removeAvatar,
    onSuccess: (updated) => {
      setUser(updated)
      toast.success('Foto removida.')
    },
    onError: (error) => toast.error(error.message),
  })

  const busy = upload.isPending || remove.isPending

  async function handleFile(file: File) {
    const problem = validateImageFile(file)
    if (problem) {
      toast.error(problem)
      return
    }

    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      setPreview(dataUrl)
      upload.mutate(dataUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível ler essa imagem.')
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar
          initials={user.initials}
          src={preview ?? user.avatarUrl}
          alt={`Foto de ${user.name}`}
          size="lg"
          className={busy ? 'opacity-50' : undefined}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full border-2 border-surface bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
          aria-label={user.avatarUrl ? 'Trocar foto de perfil' : 'Enviar foto de perfil'}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Camera className="size-3.5" />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void handleFile(file)
        }}
      />

      {user.avatarUrl && !busy && (
        <button
          type="button"
          onClick={() => remove.mutate()}
          className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-expense"
        >
          <Trash2 className="size-3.5" />
          Remover foto
        </button>
      )}
    </div>
  )
}
