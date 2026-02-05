// Quick test script to verify Cloudinary configuration
import { cloudinary } from './src/utils/cloudinary'

async function testCloudinary() {
  try {
    console.log('Testing Cloudinary configuration...')
    
    // Test basic connectivity
    const result = await cloudinary.api.ping()
    console.log('✅ Cloudinary ping successful:', result)
    
    // Test upload with a small test image (1x1 pixel PNG)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    
    const uploadResult = await cloudinary.uploader.upload(testImage, {
      folder: 'hamme/profile-pictures',
      resource_type: 'image',
      format: 'webp',
      public_id: `test-${Date.now()}`,
    })
    
    console.log('✅ Test upload successful:', uploadResult.secure_url)
    
    // Clean up test image
    await cloudinary.uploader.destroy(uploadResult.public_id)
    console.log('✅ Test cleanup successful')
    
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error)
  }
}

testCloudinary().then(() => process.exit(0))