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
 * Validate file type for image uploads
 * @param file - The file to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select a valid image file' }
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size should be less than 5MB' }
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const fileName = file.name.toLowerCase()
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
  
  if (!hasValidExtension) {
    return { isValid: false, error: 'Only .jpg, .jpeg, .png, .gif, .webp files are allowed' }
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