// Utility functions for handling image URLs and file operations

/**
 * Get the full URL for an uploaded image
 * @param imagePath - The relative path from the server
 * @returns Full URL to the image
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return ''
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // If it's a relative path, prepend the API URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  return `${apiUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
}

/**
 * Compress an image file to reduce upload time
 * @param file - The original file
 * @param maxWidth - Maximum width (default 1080px)
 * @param quality - JPEG quality 0-1 (default 0.8)
 * @returns Promise that resolves to the compressed file
 */
export const compressImage = async (
  file: File,
  maxWidth = 1080,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }
          // Create new file with same name
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          console.log(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`)
          resolve(compressedFile)
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validate file type for image uploads
 * @param file - The file to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select a valid image file' }
  }
  
  // Check file size (3MB limit for faster uploads)
  const maxSize = 3 * 1024 * 1024 // 3MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size should be less than 3MB' }
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'] // Remove .gif for faster processing
  const fileName = file.name.toLowerCase()
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
  
  if (!hasValidExtension) {
    return { isValid: false, error: 'Only .jpg, .jpeg, .png, .webp files are allowed' }
  }
  
  return { isValid: true }
}

/**
 * Create a preview URL for a file
 * @param file - The file to create preview for
 * @returns Promise that resolves to the preview URL
 */
export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = (error) => {
      reject(error)
    }
    reader.readAsDataURL(file)
  })
}