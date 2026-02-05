import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

// Configure Cloudinary using env vars
// Supports either CLOUDINARY_URL or individual vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Debug log to verify config (remove in production)
console.log('Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✓' : '✗',
  api_key: process.env.CLOUDINARY_API_KEY ? '✓' : '✗',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✓' : '✗',
})

export { cloudinary }
