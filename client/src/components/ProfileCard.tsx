import { useState, useEffect, useRef } from 'react'
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
  subtitle?: string
}

function ProfileCard({ onDateClick, onFriendsClick, onRejectClick, userOverride = null, showEdit = true, subtitle }: ProfileCardProps) {
  const [user, setUser] = useState<User | null>(userOverride)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const handlePrimaryAction = () => {
    if (isUnder18) {
      onFriendsClick?.()
    } else {
      onDateClick?.()
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Profile Image with Overlay */}
        <div className="relative h-[520px]">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-white text-6xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          {/* Edit Photo Icon Button */}
          {showEdit && (
            <button
              onClick={handleEditPhotoClick}
              disabled={uploading}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
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
          
          {/* Bottom-right action buttons overlay */}
          <div className="absolute right-6 bottom-6 flex flex-col items-center space-y-4">
            <button
              onClick={onRejectClick}
              className="w-14 h-14 bg-white text-gray-900 rounded-full flex items-center justify-center text-2xl shadow-xl hover:scale-110 transition-transform"
              title="Not Interested"
            >
              ❌
            </button>
            <button
              onClick={onFriendsClick}
              className="w-14 h-14 bg-white text-yellow-500 rounded-full flex items-center justify-center text-2xl shadow-xl hover:scale-110 transition-transform"
              title="Just Friends"
            >
              ⭐️
            </button>
            <button
              onClick={handlePrimaryAction}
              className={`w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-xl hover:scale-110 transition-transform ${isUnder18 ? 'text-blue-600' : 'text-pink-600'}`}
              title={isUnder18 ? 'Chat' : 'Accept Date'}
            >
              {isUnder18 ? '💬' : '💗'}
            </button>
          </div>

          {/* Text overlay */}
          <div className="absolute bottom-6 left-6 text-left text-white">
            <h2 className="text-2xl font-bold mb-1">
              {user.name}
            </h2>
            {derivedAge !== undefined && derivedAge !== null && (
              <p className="text-white/80 text-sm">{derivedAge}</p>
            )}
            {subtitle && (
              <p className="text-white/80 text-sm mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Removed bottom white section to match full-bleed card style */}
        {error && (
          <div className="p-4 text-center text-sm text-red-600">{error}</div>
        )}
      </div>
    </div>
  )
}

export default ProfileCard