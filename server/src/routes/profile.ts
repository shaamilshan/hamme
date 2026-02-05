import express, { Request, Response } from 'express'
import { User } from '../models/User'
import { authenticateToken } from '../middleware/auth'
import { upload, handleUploadError, deleteOldProfilePicture } from '../utils/fileUpload'
import { cloudinary } from '../utils/cloudinary'

const router = express.Router()

// Update user's date of birth
router.patch('/dob', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dateOfBirth } = req.body
    
    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth is required'
      })
    }

    // Validate date format
    const dobDate = new Date(dateOfBirth)
    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      })
    }

    // Calculate age
    const today = new Date()
    let age = today.getFullYear() - dobDate.getFullYear()
    const monthDiff = today.getMonth() - dobDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--
    }

    // Validate age (13-100)
    if (age < 13) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 13 years old'
      })
    }

    if (age > 100) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid date of birth'
      })
    }

    // Get user ID from authentication middleware
    const userId = req.user._id

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        dateOfBirth: dobDate,
        age: age
      },
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      message: 'Date of birth updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating date of birth:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Upload profile picture file
router.post('/upload-picture', authenticateToken, upload.single('profilePicture'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const userId = req.user._id

    // Upload to Cloudinary via stream using the file buffer
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hamme/profile-pictures',
          resource_type: 'image',
          // Remove heavy transformations during upload - do them on-demand via URL
          quality: 'auto:good',
          fetch_format: 'auto',
          public_id: `profile-${userId}-${Date.now()}`,
          // Enable eager async transformation instead of blocking upload
          eager_async: true,
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        }
      )

      uploadStream.end(req.file!.buffer)
    })

    const fileUrl = uploadResult.secure_url

    // Get current user to delete old local profile picture if any
    const currentUser = await User.findById(userId)
    const oldProfilePicture = currentUser?.profilePicture

    // Update user with new Cloudinary URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: fileUrl },
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Delete old local file only (skip cloud URLs)
    if (oldProfilePicture && oldProfilePicture !== fileUrl) {
      deleteOldProfilePicture(oldProfilePicture)
    }

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      user: updatedUser,
      fileUrl
    })

  } catch (error) {
    console.error('Error uploading profile picture:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}, handleUploadError)

// Update user's profile picture (for base64 data - legacy support)
router.patch('/profile-picture', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { profilePicture } = req.body
    
    if (!profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture URL is required'
      })
    }

    // Get user ID from authentication middleware
    const userId = req.user._id

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture },
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating profile picture:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Get user ID from authentication middleware
    const userId = req.user._id

    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

export default router