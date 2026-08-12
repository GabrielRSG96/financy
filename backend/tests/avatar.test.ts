import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { uploadsDir } from '../src/lib/uploads.js'
import { createHarness, errorCode, type Harness } from './helpers/harness.js'

const USER_FIELDS = 'id name email initials avatarUrl'

const UPDATE_AVATAR = `mutation ($image: String!) { updateAvatar(image: $image) { ${USER_FIELDS} } }`
const REMOVE_AVATAR = `mutation { removeAvatar { ${USER_FIELDS} } }`
const ME = `query { me { ${USER_FIELDS} } }`

const PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a4944415478da6300010000050001' +
    '0d0a2db40000000049454e44ae426082',
  'hex',
)

const PNG = `data:image/png;base64,${PNG_BYTES.toString('base64')}`
const JPEG = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).toString('base64')}`

function fileFromUrl(url: string): string {
  return url.split('/uploads/')[1]
}

describe('avatar', () => {
  let h: Harness
  let token: string

  beforeAll(async () => {
    h = await createHarness('avatar')
    token = (await h.signUp('avatar@teste.com', 'Ana Vieira')).token
  })

  afterAll(async () => {
    await h.close()
    rmSync(uploadsDir(), { recursive: true, force: true })
  })

  it('começa sem avatar', async () => {
    const { data } = await h.run<{ me: { avatarUrl: string | null; initials: string } }>(ME, {}, token)
    expect(data?.me.avatarUrl).toBeNull()
    expect(data?.me.initials).toBe('AV')
  })

  it('exige autenticação', async () => {
    const { errors } = await h.run(UPDATE_AVATAR, { image: PNG })
    expect(errorCode(errors)).toBe('UNAUTHENTICATED')

    const removed = await h.run(REMOVE_AVATAR)
    expect(errorCode(removed.errors)).toBe('UNAUTHENTICATED')
  })

  it('salva a imagem e devolve uma URL absoluta', async () => {
    const { data, errors } = await h.run<{ updateAvatar: { avatarUrl: string } }>(
      UPDATE_AVATAR,
      { image: PNG },
      token,
    )

    expect(errors).toBeUndefined()
    const url = data!.updateAvatar.avatarUrl
    expect(url).toMatch(/^http:\/\/localhost:4000\/uploads\/[\w-]+\.png$/)

    const saved = join(uploadsDir(), fileFromUrl(url))
    expect(existsSync(saved)).toBe(true)
    expect(readFileSync(saved).equals(PNG_BYTES)).toBe(true)
  })

  it('mantém o avatar entre requisições', async () => {
    const { data } = await h.run<{ me: { avatarUrl: string } }>(ME, {}, token)
    expect(data?.me.avatarUrl).toContain('/uploads/')
  })

  it('apaga o arquivo anterior ao trocar de foto', async () => {
    const antes = (await h.run<{ me: { avatarUrl: string } }>(ME, {}, token)).data!.me.avatarUrl
    const antigo = join(uploadsDir(), fileFromUrl(antes))

    const { data } = await h.run<{ updateAvatar: { avatarUrl: string } }>(
      UPDATE_AVATAR,
      { image: JPEG },
      token,
    )
    const novo = join(uploadsDir(), fileFromUrl(data!.updateAvatar.avatarUrl))

    expect(data!.updateAvatar.avatarUrl).toMatch(/\.jpg$/)
    expect(existsSync(novo)).toBe(true)
    expect(existsSync(antigo)).toBe(false)
  })

  it('remove o avatar e o arquivo do disco', async () => {
    const atual = (await h.run<{ me: { avatarUrl: string } }>(ME, {}, token)).data!.me.avatarUrl
    const caminho = join(uploadsDir(), fileFromUrl(atual))

    const { data, errors } = await h.run<{ removeAvatar: { avatarUrl: string | null } }>(
      REMOVE_AVATAR,
      {},
      token,
    )

    expect(errors).toBeUndefined()
    expect(data?.removeAvatar.avatarUrl).toBeNull()
    expect(existsSync(caminho)).toBe(false)
  })

  it('remover sem ter avatar não quebra', async () => {
    const { data, errors } = await h.run<{ removeAvatar: { avatarUrl: string | null } }>(
      REMOVE_AVATAR,
      {},
      token,
    )
    expect(errors).toBeUndefined()
    expect(data?.removeAvatar.avatarUrl).toBeNull()
  })

  describe('validação', () => {
    it('recusa formato não suportado', async () => {
      const svg = `data:image/svg+xml;base64,${Buffer.from('<svg/>').toString('base64')}`
      const { errors } = await h.run(UPDATE_AVATAR, { image: svg }, token)
      expect(errorCode(errors)).toBe('BAD_USER_INPUT')
      expect(errors?.[0].message).toContain('PNG, JPEG ou WebP')
    })

    it('recusa texto que não é data URL', async () => {
      const { errors } = await h.run(UPDATE_AVATAR, { image: 'https://exemplo.com/foto.png' }, token)
      expect(errorCode(errors)).toBe('BAD_USER_INPUT')
    })

    it('recusa arquivo que mente sobre o tipo', async () => {
      const falso = `data:image/png;base64,${Buffer.from('<?php system($_GET[0]); ?>').toString('base64')}`
      const { errors } = await h.run(UPDATE_AVATAR, { image: falso }, token)
      expect(errorCode(errors)).toBe('BAD_USER_INPUT')
      expect(errors?.[0].message).toContain('não é uma imagem válida')
    })

    it('recusa imagem acima de 2 MB', async () => {
      const gorda = Buffer.concat([PNG_BYTES, Buffer.alloc(2 * 1024 * 1024, 1)])
      const { errors } = await h.run(
        UPDATE_AVATAR,
        { image: `data:image/png;base64,${gorda.toString('base64')}` },
        token,
      )
      expect(errorCode(errors)).toBe('BAD_USER_INPUT')
      expect(errors?.[0].message).toContain('2 MB')
    })

    it('recusa imagem vazia', async () => {
      const { errors } = await h.run(UPDATE_AVATAR, { image: 'data:image/png;base64,' }, token)
      expect(errorCode(errors)).toBe('BAD_USER_INPUT')
    })

    it('não grava arquivo quando a validação falha', async () => {
      const antes = (await h.run<{ me: { avatarUrl: string | null } }>(ME, {}, token)).data!.me.avatarUrl
      await h.run(UPDATE_AVATAR, { image: 'data:text/plain;base64,bm9wZQ==' }, token)
      const depois = (await h.run<{ me: { avatarUrl: string | null } }>(ME, {}, token)).data!.me.avatarUrl
      expect(depois).toBe(antes)
    })
  })

  describe('isolamento', () => {
    it('cada usuário só altera o próprio avatar', async () => {
      const bob = await h.signUp('bob-avatar@teste.com', 'Bob Silva')

      await h.run(UPDATE_AVATAR, { image: PNG }, token)
      await h.run(UPDATE_AVATAR, { image: JPEG }, bob.token)

      const ana = (await h.run<{ me: { avatarUrl: string } }>(ME, {}, token)).data!.me.avatarUrl
      const dele = (await h.run<{ me: { avatarUrl: string } }>(ME, {}, bob.token)).data!.me.avatarUrl

      expect(ana).toMatch(/\.png$/)
      expect(dele).toMatch(/\.jpg$/)
      expect(ana).not.toBe(dele)

      await h.run(REMOVE_AVATAR, {}, bob.token)

      const anaDepois = (await h.run<{ me: { avatarUrl: string } }>(ME, {}, token)).data!.me.avatarUrl
      expect(anaDepois).toBe(ana)
      expect(existsSync(join(uploadsDir(), fileFromUrl(anaDepois)))).toBe(true)
    })
  })
})
