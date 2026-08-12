import { describe, expect, it } from 'vitest'
import { ACCEPT_ATTRIBUTE, cropToSquare, MAX_FILE_BYTES, validateImageFile } from './image'

function fakeFile(type: string, size: number): File {
  const file = new File(['x'], 'foto', { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateImageFile', () => {
  it('aceita os formatos suportados pela API', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      expect(validateImageFile(fakeFile(type, 1024))).toBeNull()
    }
  })

  it('recusa formato não suportado', () => {
    expect(validateImageFile(fakeFile('image/gif', 1024))).toContain('PNG, JPEG ou WebP')
    expect(validateImageFile(fakeFile('application/pdf', 1024))).toContain('PNG, JPEG ou WebP')
  })

  it('recusa arquivo grande demais', () => {
    expect(validateImageFile(fakeFile('image/png', MAX_FILE_BYTES + 1))).toContain('no máximo')
  })

  it('aceita exatamente no limite', () => {
    expect(validateImageFile(fakeFile('image/png', MAX_FILE_BYTES))).toBeNull()
  })

  it('oferece os mesmos tipos no accept do input', () => {
    expect(ACCEPT_ATTRIBUTE).toBe('image/png,image/jpeg,image/webp')
  })
})

describe('cropToSquare', () => {
  it('não corta imagem já quadrada', () => {
    expect(cropToSquare(400, 400)).toEqual({ side: 400, x: 0, y: 0 })
  })

  it('centraliza o corte na horizontal', () => {
    expect(cropToSquare(800, 400)).toEqual({ side: 400, x: 200, y: 0 })
  })

  it('centraliza o corte na vertical', () => {
    expect(cropToSquare(400, 900)).toEqual({ side: 400, x: 0, y: 250 })
  })

  it('arredonda deslocamento ímpar', () => {
    expect(cropToSquare(101, 100)).toEqual({ side: 100, x: 1, y: 0 })
  })
})
