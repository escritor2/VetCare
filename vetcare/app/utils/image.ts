/** Tamanho máximo da foto em caracteres (o Firestore aceita até 1 MB por documento) */
export const MAX_FOTO_CHARS = 250_000

/**
 * Reduz e comprime a foto no próprio navegador antes de salvar.
 * Retorna um data URL JPEG (ex.: "data:image/jpeg;base64,...").
 */
export async function compressImage(file: File, maxSide = 640): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('nao-e-imagem')

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas-indisponivel')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  for (let quality = 0.85; quality >= 0.4; quality -= 0.1) {
    const url = canvas.toDataURL('image/jpeg', quality)
    if (url.length <= MAX_FOTO_CHARS) return url
  }
  throw new Error('imagem-grande')
}
