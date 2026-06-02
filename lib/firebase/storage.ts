import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'

// Compress image using Canvas (no external library needed)
async function compressImage(file: File, maxSizeKB = 500): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Scale down if too large
      const MAX_DIMENSION = 1200
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Compression failed')); return }
          resolve(blob)
        },
        'image/webp',
        0.8
      )
    }
    img.onerror = reject
    img.src = url
  })
}

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<{ url: string; thumbUrl: string }> {
  const compressed = await compressImage(file, 500)
  const path = `products/${productId}/main.webp`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, compressed, { contentType: 'image/webp' })
  const url = await getDownloadURL(storageRef)

  // Create thumbnail (smaller size)
  const thumbBlob = await compressImage(file, 100)
  const thumbPath = `products/${productId}/thumb.webp`
  const thumbRef = ref(storage, thumbPath)
  await uploadBytes(thumbRef, thumbBlob, { contentType: 'image/webp' })
  const thumbUrl = await getDownloadURL(thumbRef)

  return { url, thumbUrl }
}

export async function deleteProductImage(productId: string): Promise<void> {
  try {
    await deleteObject(ref(storage, `products/${productId}/main.webp`))
    await deleteObject(ref(storage, `products/${productId}/thumb.webp`))
  } catch {
    // Ignore if files don't exist
  }
}
