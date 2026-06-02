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

// Convert Blob to Base64 Data URL
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<{ url: string; thumbUrl: string }> {
  // Compress main image to very small size (target <150KB)
  const compressed = await compressImage(file, 150)
  const url = await blobToBase64(compressed)

  // Create thumbnail (smaller size, target <40KB)
  const thumbBlob = await compressImage(file, 40)
  const thumbUrl = await blobToBase64(thumbBlob)

  return { url, thumbUrl }
}

export async function deleteProductImage(productId: string): Promise<void> {
  // No-op because images are stored inline within the Firestore document
}
