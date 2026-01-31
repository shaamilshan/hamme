import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, type PanInfo } from 'framer-motion'

import { getImageUrl, validateImageFile, createFilePreview } from '../utils/imageUtils'
import { apiService } from '../services/api'

interface User {
  id?: string
  name: string
  email?: string
  dateOfBirth?: string
  profilePicture?: string
  age?: number
}

interface ProfileCardProps {
  onDateClick?: () => void
  onFriendsClick?: () => void
  onRejectClick?: () => void
  userOverride?: User | null
  showEdit?: boolean
  showActions?: boolean
  subtitle?: string
}

function ProfileCard({ onDateClick, onFriendsClick, onRejectClick, userOverride = null, showEdit = true, showActions = true }: ProfileCardProps) {
  const [user, setUser] = useState<User | null>(userOverride)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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
  const profileImageUrl = previewUrl || (user.profilePicture ? getImageUrl(user.profilePicture) : null)

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

    try {
      setUploading(true)
      setError(null)
      // Show local preview instantly
      const preview = await createFilePreview(file)
      setPreviewUrl(preview)

      // Upload to server
      const response = await apiService.uploadProfilePicture(file)
      const updatedUser: User = response.data.user
      setUser(updatedUser)
      setPreviewUrl(null)
    } catch (err: any) {
      console.error('Failed to upload profile picture:', err)
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
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
    <div className="w-full max-w-sm mx-auto relative cursor-grab active:cursor-grabbing">
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragStart={() => { }}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, y, rotate }}
        whileTap={{ scale: 1.05 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden relative"
      >
        {/* Swipe Feedback Overlays */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 bg-pink-500/30 z-30 pointer-events-none flex items-center justify-center">
          <div className="border-4 border-pink-500 text-6xl px-6 py-4 rounded-full -rotate-12 bg-white/40 backdrop-blur-sm">💗</div>
        </motion.div>
        <motion.div style={{ opacity: rejectOpacity }} className="absolute inset-0 bg-red-500/30 z-30 pointer-events-none flex items-center justify-center">
          <div className="border-4 border-red-500 text-6xl px-6 py-4 rounded-full rotate-12 bg-white/40 backdrop-blur-sm">❌</div>
        </motion.div>
        <motion.div style={{ opacity: friendOpacity }} className="absolute inset-0 bg-yellow-500/30 z-30 pointer-events-none flex items-center justify-center">
          <div className="border-4 border-yellow-500 text-6xl px-6 py-4 rounded-full bg-white/40 backdrop-blur-sm">⭐️</div>
        </motion.div>

        {/* Profile Image with Overlay - Hold to reveal actions (Keeping legacy interactions as fallback) */}
        <div
          className="relative h-[520px] select-none"
        >
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
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

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>

          {/* Edit Photo Icon Button */}
          {showEdit && (
            <button
              onClick={handleEditPhotoClick}
              disabled={uploading}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow-md disabled:opacity-60 disabled:cursor-not-allowed z-20"
              title="Edit Photo"
              aria-label="Edit Photo"
            >
              {uploading ? (
                <span className="text-xs font-medium">...</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232a2.5 2.5 0 113.536 3.536L8.5 19H5v-3.5l10.232-10.268z"></path>
                </svg>
              )}
            </button>
          )}

          {/* Hidden file input */}
          {showEdit && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
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
            </div>
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