import { randomUUID } from 'node:crypto'
import { mkdirSync, existsSync } from 'node:fs'
import { unlink, writeFile } from 'node:fs/promises'
import { isAbsolute, join, resolve } from 'node:path'
import { env } from '../config/env.js'
import { badRequest } from './errors.js'

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

const ACCEPTED = {
  'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
  'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  'image/webp': { ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46] },
} as const

export type AcceptedMime = keyof typeof ACCEPTED

export const ACCEPTED_MIMES = Object.keys(ACCEPTED) as AcceptedMime[]

export function uploadsDir(): string {
  return isAbsolute(env.UPLOADS_DIR) ? env.UPLOADS_DIR : resolve(process.cwd(), env.UPLOADS_DIR)
}

export function ensureUploadsDir(): string {
  const dir = uploadsDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export function avatarUrl(file: string | null): string | null {
  return file ? `${env.publicUrl}/uploads/${file}` : null
}

const DATA_URL = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/is

interface DecodedImage {
  bytes: Buffer
  mime: AcceptedMime
  ext: string
}

export function decodeImageDataUrl(input: string): DecodedImage {
  const match = DATA_URL.exec(input.trim())
  if (!match) throw badRequest('Envie a imagem como data URL em base64.')

  const mime = match[1].toLowerCase()
  if (!(mime in ACCEPTED)) {
    throw badRequest('Formato não suportado. Envie PNG, JPEG ou WebP.')
  }

  const accepted = ACCEPTED[mime as AcceptedMime]
  const bytes = Buffer.from(match[2], 'base64')

  if (bytes.length === 0) throw badRequest('A imagem enviada está vazia.')
  if (bytes.length > AVATAR_MAX_BYTES) {
    throw badRequest(`A imagem deve ter no máximo ${AVATAR_MAX_BYTES / 1024 / 1024} MB.`)
  }

  const header = accepted.magic
  const matchesMagic = header.every((byte, index) => bytes[index] === byte)
  if (!matchesMagic) throw badRequest('O arquivo enviado não é uma imagem válida.')

  return { bytes, mime: mime as AcceptedMime, ext: accepted.ext }
}

export async function saveAvatar(dataUrl: string): Promise<string> {
  const { bytes, ext } = decodeImageDataUrl(dataUrl)
  const dir = ensureUploadsDir()
  const file = `${randomUUID()}.${ext}`

  await writeFile(join(dir, file), bytes)

  return file
}

export async function deleteAvatar(file: string | null): Promise<void> {
  if (!file) return
  if (file.includes('/') || file.includes('\\') || file.includes('..')) return

  try {
    await unlink(join(uploadsDir(), file))
  } catch {
    return
  }
}
