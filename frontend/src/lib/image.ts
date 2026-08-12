export const AVATAR_SIZE = 512

export const MAX_FILE_BYTES = 5 * 1024 * 1024

export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(',')

export function validateImageFile(file: File): string | null {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return 'Escolha uma imagem PNG, JPEG ou WebP.'
  }

  if (file.size > MAX_FILE_BYTES) {
    return `A imagem deve ter no máximo ${MAX_FILE_BYTES / 1024 / 1024} MB.`
  }

  return null
}

export function cropToSquare(width: number, height: number) {
  const side = Math.min(width, height)

  return {
    side,
    x: Math.round((width - side) / 2),
    y: Math.round((height - side) / 2),
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler essa imagem.'))
    }

    image.src = url
  })
}

export async function fileToAvatarDataUrl(file: File, size = AVATAR_SIZE): Promise<string> {
  const image = await loadImage(file)
  const { side, x, y } = cropToSquare(image.naturalWidth, image.naturalHeight)
  const target = Math.min(size, side)

  const canvas = document.createElement('canvas')
  canvas.width = target
  canvas.height = target

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível processar essa imagem.')

  context.drawImage(image, x, y, side, side, 0, 0, target, target)

  const dataUrl = canvas.toDataURL('image/webp', 0.85)

  return dataUrl.startsWith('data:image/webp')
    ? dataUrl
    : canvas.toDataURL('image/jpeg', 0.85)
}
