import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request, Response, NextFunction } from 'express'

// Note: No local directory creation for serverless/Vercel deployment
// All uploads go directly to Cloudinary via memory storage

// Configure multer storage to memory (for Cloudinary upload)
const storage = multer.memoryStorage()

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed!'))
    return
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const fileExtension = path.extname(file.originalname).toLowerCase()
  
  if (!allowedExtensions.includes(fileExtension)) {
    cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, .gif, .webp files are allowed!'))
    return
  }

  cb(null, true)
}

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
})

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed.'
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "profilePicture" as the field name.'
      })
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }

  next(error)
}

// Utility function to delete old profile picture (serverless-safe)
export const deleteOldProfilePicture = (filename: string) => {
  if (!filename) return
  
  try {
    // Only attempt delete if it's a local file path in our uploads directory
    // Skip deletion in serverless environments (Vercel) - no local filesystem
    if (!filename.startsWith('/uploads/') || process.env.VERCEL) {
      console.log('Skipping local file deletion in serverless environment or for cloud URLs')
      return
    }
    
    // For local development only - construct path relative to current working directory
    const uploadDir = path.join(process.cwd(), 'public/uploads/profile-pictures')
    const filePath = path.join(uploadDir, path.basename(filename))
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Deleted old profile picture: ${filename}`)
    }
  } catch (error) {
    console.error('Error deleting old profile picture:', error)
    // Don't throw - deletion failure shouldn't break the upload flow
  }
}

// No local optimization step; images are uploaded to Cloudinary directly