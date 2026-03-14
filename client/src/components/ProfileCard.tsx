import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, type PanInfo } from 'framer-motion'

import { getImageUrl, validateImageFile, createFilePreview, compressImage } from '../utils/imageUtils'
import { apiService } from '../services/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'

interface User {
  id?: string
  name: string
  email?: string
  dateOfBirth?: string
  profilePicture?: string
  age?: number
  instagramId?: string
  photos?: string[]
}

interface ProfileCardProps {
  onDateClick?: () => void
  onFriendsClick?: () => void
  onRejectClick?: () => void
  onInstagramShare?: () => void
  onCopyLink?: () => void
  linkCopied?: boolean
  userOverride?: User | null
  showEdit?: boolean
  showActions?: boolean
  draggable?: boolean
  subtitle?: string
}

function ProfileCard({ onDateClick, onFriendsClick, onRejectClick, onInstagramShare, onCopyLink, linkCopied, userOverride = null, showEdit = true, showActions = true, draggable = true }: ProfileCardProps) {
  const [user, setUser] = useState<User | null>(userOverride)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /* Animation & Swipe Logic */
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const controls = useAnimation()

  // Visual feedback opacities
  const likeOpacity = useTransform(x, [20, 150], [0, 1])
  const rejectOpacity = useTransform(x, [-20, -150], [0, 1])
  const friendOpacity = useTransform(y, [-20, -150], [0, 1])

  // Reset card position if user changes
  useEffect(() => {
    x.set(0)
    y.set(0)
    controls.start({ x: 0, y: 0, opacity: 1, rotate: 0, transition: { duration: 0.3 } })
  }, [user, controls, x, y])


  useEffect(() => {
    // If a user is provided, skip fetching
    if (userOverride) {
      setUser(userOverride)
      setLoading(false)
      return
    }

    const fetchUserProfile = async () => {
      try {
        const response = await apiService.getProfile()
        setUser(response.data.user)
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [userOverride])

  // Auto-slide photos every 3 seconds
  const photoCountRef = useRef(0)
  useEffect(() => {
    // Update ref so we always have the latest count
    const photos = user?.photos || []
    const count = photos.length > 0 ? photos.length : (user?.profilePicture ? 1 : 0)
    photoCountRef.current = count
  }, [user])

  useEffect(() => {
    if (photoCountRef.current <= 1) return
    const timer = setInterval(() => {
      setCurrentPhotoIndex(prev => (prev + 1) % photoCountRef.current)
    }, 3000)
    return () => clearInterval(timer)
  }, [currentPhotoIndex, user])

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-pulse">
          <div className="h-96 bg-gray-300"></div>
          <div className="p-6">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="flex justify-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center">
          <p className="text-gray-500">Failed to load profile</p>
        </div>
      </div>
    )
  }

  const derivedAge = user.dateOfBirth ? calculateAge(user.dateOfBirth) : user.age
  const isUnder18 = typeof derivedAge === 'number' && derivedAge < 18

  // Build the list of all photos for the slideshow
  const allPhotos: string[] = []
  if (user.photos && user.photos.length > 0) {
    user.photos.forEach(p => {
      const url = getImageUrl(p)
      if (url && !allPhotos.includes(url)) allPhotos.push(url)
    })
  } else if (user.profilePicture) {
    allPhotos.push(getImageUrl(user.profilePicture))
  }
  // Override with preview if uploading
  const displayPhotos = previewUrl ? [previewUrl, ...allPhotos.slice(1)] : allPhotos
  const safeIndex = displayPhotos.length > 0 ? Math.min(currentPhotoIndex, displayPhotos.length - 1) : 0
  const currentImageUrl = displayPhotos.length > 0 ? displayPhotos[safeIndex] : null

  const handlePhotoTap = (e: React.MouseEvent) => {
    if (displayPhotos.length <= 1) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const tapX = e.clientX - rect.left
    if (tapX < rect.width / 2) {
      // Tap left — previous
      setCurrentPhotoIndex(prev => Math.max(0, prev - 1))
    } else {
      // Tap right — next
      setCurrentPhotoIndex(prev => Math.min(displayPhotos.length - 1, prev + 1))
    }
  }

  const handleEditPhotoClick = () => {
    setError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid image file')
      e.target.value = ''
      return
    }

    // Reset progress
    setUploadProgress(0)
    setUploading(true)
    setError(null)

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      // Show local preview instantly
      const preview = await createFilePreview(file)
      setPreviewUrl(preview)

      // Compress image before uploading for faster transfer
      const compressedFile = await compressImage(file)

      // Upload compressed file to server
      const response = await apiService.uploadProfilePicture(compressedFile)

      clearInterval(interval)
      setUploadProgress(100)

      const updatedUser: User = response.data.user

      // Small delay to show 100% completion
      setTimeout(() => {
        setUser(updatedUser)
        setPreviewUrl(null)
        setUploading(false)
        setUploadProgress(0)
      }, 500)

    } catch (err: any) {
      clearInterval(interval)
      setUploading(false)
      setUploadProgress(0)
      console.error('Failed to upload profile picture:', err)
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.')
      setPreviewUrl(null)
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 100
    const velocityThreshold = 500

    // Swipe Right (Date)
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      await controls.start({ x: 500, rotate: 20, opacity: 0, transition: { duration: 0.4 } })
      handlePrimaryAction()
    }
    // Swipe Left (Reject)
    else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      await controls.start({ x: -500, rotate: -20, opacity: 0, transition: { duration: 0.4 } })
      onRejectClick?.()
    }
    // Swipe Up (Friends)
    else if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
      await controls.start({ y: -500, opacity: 0, transition: { duration: 0.4 } })
      onFriendsClick?.()
    }
    // Snap back
    else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } })
    }
  }

  const handlePrimaryAction = () => {
    if (isUnder18) {
      onFriendsClick?.()
    } else {
      onDateClick?.()
    }
  }

  return (
    <div className="w-full h-full max-w-sm mx-auto relative cursor-grab active:cursor-grabbing">
      <motion.div
        drag={draggable}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragStart={() => { }}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, y, rotate }}
        whileTap={{ scale: 1.05 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden relative h-full"
      >
        {/* Swipe Feedback Overlays */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 bg-green-500/30 z-30 pointer-events-none flex items-center justify-center">
          <div className="border-4 border-green-500 text-green-500 font-bold text-4xl px-4 py-2 rounded -rotate-12 bg-white/20 backdrop-blur-sm">LIKE</div>
        </motion.div>
        <motion.div style={{ opacity: rejectOpacity }} className="absolute inset-0 bg-red-500/30 z-30 pointer-events-none flex items-center justify-center">
          <div className="border-4 border-red-500 text-red-500 font-bold text-4xl px-4 py-2 rounded rotate-12 bg-white/20 backdrop-blur-sm">NOPE</div>
        </motion.div>
        <motion.div style={{ opacity: friendOpacity }} className="absolute inset-0 bg-blue-500/30 z-30 pointer-events-none flex items-center justify-center">
          <div className="border-4 border-blue-500 text-blue-500 font-bold text-4xl px-4 py-2 rounded bg-white/20 backdrop-blur-sm">FRIENDS</div>
        </motion.div>

        {/* Profile Image with Overlay */}
        <div
          className="relative h-full select-none"
          onClick={handlePhotoTap}
        >
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={user.name}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-white text-6xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Segment bars at the top */}
          {displayPhotos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1 pointer-events-none">
              {displayPhotos.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-[3px] rounded-full transition-colors duration-200"
                  style={{
                    backgroundColor: i === safeIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>

          {/* Upload Progress Bar Overlay */}
          {uploading && (
            <div className="absolute inset-0 z-40 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#906EF6]"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <p className="text-white mt-2 font-medium">Uploading...</p>
            </div>
          )}


          {/* Name & Age above bottom action buttons row */}
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3">
            <div className="w-full px-6 text-white text-left pointer-events-none">
              <h2 className="text-2xl">
                <span className="font-bold">{user.name}</span>
                {derivedAge !== undefined && derivedAge !== null && (
                  <span className="text-white/80">{`, ${derivedAge}`}</span>
                )}
              </h2>
              {user.instagramId && (
                <p className="text-sm mt-0.5 font-medium flex items-center gap-1" style={{ color: '#906EF6' }}>
                  <FontAwesomeIcon icon={faInstagram} className="w-3.5 h-3.5" />
                  @{user.instagramId}
                </p>
              )}
            </div>
            {/* Share icon buttons - only on own card */}
            {!showActions && (onInstagramShare || onCopyLink) && (
              <div className="absolute bottom-6 right-6 flex flex-col gap-3 pointer-events-auto z-20">
                {onInstagramShare && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onInstagramShare(); }}
                    className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/25 active:scale-90 transition-all duration-200 shadow-lg"
                    title="Share to Instagram Story"
                  >
                    <FontAwesomeIcon icon={faInstagram} className="w-5 h-5 text-white" />
                  </button>
                )}
                {onCopyLink && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopyLink(); }}
                    className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/25 active:scale-90 transition-all duration-200 shadow-lg"
                    title={linkCopied ? 'Copied!' : 'Copy Link'}
                  >
                    <span className="text-white text-lg">{linkCopied ? '✅' : '🔗'}</span>
                  </button>
                )}
              </div>
            )}
            {showActions && (
              <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-3 flex items-center gap-4 pointer-events-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); onRejectClick?.(); }}
                  className="w-14 h-14 bg-white text-gray-900 rounded-full flex items-center justify-center text-2xl shadow-xl hover:scale-110 hover:bg-red-50 active:scale-95 transition-all duration-200"
                  title="Not Interested"
                >
                  ❌
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onFriendsClick?.(); }}
                  className="w-14 h-14 bg-white text-yellow-500 rounded-full flex items-center justify-center text-2xl shadow-xl hover:scale-110 hover:bg-yellow-50 active:scale-95 transition-all duration-200"
                  title="Just Friends"
                >
                  ⭐️
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrimaryAction(); }}
                  className={`w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 ${isUnder18 ? 'text-blue-600 hover:bg-blue-50' : 'text-pink-600 hover:bg-pink-50'}`}
                  title={isUnder18 ? 'Chat' : 'Accept Date'}
                >
                  {isUnder18 ? '💬' : '💗'}
                </button>
              </div>
            )}
          </div>

          {/* Text overlay moved above buttons */}
        </div>

        {/* Removed bottom white section to match full-bleed card style */}
        {error && (
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        )}
      </motion.div>
    </div>
  )
}

export default ProfileCard