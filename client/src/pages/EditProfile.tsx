import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'
import BottomNavigation from '../components/BottomNavigation'

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
)

interface UserProfile {
    name: string
    instagramId?: string
    profilePicture?: string
    photos?: string[]
}

function EditProfile() {
    const navigate = useNavigate()

    const [profile, setProfile] = useState<UserProfile>({ name: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [photos, setPhotos] = useState<string[]>([])
    const addPhotoInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiService.getProfile()
                const user = res.data.user
                setProfile({
                    name: user.name || '',
                    instagramId: user.instagramId || '',
                    profilePicture: user.profilePicture || '',
                    photos: user.photos || [],
                })
                setPhotos(user.photos || [])
            } catch (err) {
                console.error('Failed to load profile:', err)
                setError('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleSave = async () => {
        if (!profile.name.trim()) {
            setError('Name is required')
            return
        }

        setSaving(true)
        setError('')

        try {
            await apiService.updateProfile({
                name: profile.name.trim(),
                instagramId: profile.instagramId || '',
            })
            setSuccess(true)
            setTimeout(() => navigate('/dashboard'), 1200)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (photos.length >= 6) {
            setError('Maximum 6 photos allowed')
            return
        }

        setUploading(true)
        setError('')
        try {
            const res = await apiService.uploadPhoto(file)
            const updatedPhotos = res.data.user?.photos || [...photos, res.data.fileUrl]
            setPhotos(updatedPhotos)
            setProfile(prev => ({ ...prev, photos: updatedPhotos, profilePicture: res.data.user?.profilePicture || prev.profilePicture }))
        } catch (err: any) {
            console.error('Upload failed:', err)
            setError(err.response?.data?.message || 'Failed to upload photo')
        } finally {
            setUploading(false)
            if (e.target) e.target.value = ''
        }
    }

    const handleRemovePhoto = async (index: number) => {
        setError('')
        try {
            const res = await apiService.deletePhoto(index)
            const updatedPhotos = res.data.user?.photos || []
            setPhotos(updatedPhotos)
            setProfile(prev => ({ ...prev, photos: updatedPhotos, profilePicture: res.data.user?.profilePicture || '' }))
        } catch (err: any) {
            console.error('Delete failed:', err)
            setError(err.response?.data?.message || 'Failed to delete photo')
        }
    }

    const inputStyle = {
        backgroundColor: 'rgba(144, 110, 246, 0.1)',
        color: '#fff',
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#906EF6] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black flex flex-col font-sans text-white">
            {/* Header */}
            <motion.header
                className="flex-shrink-0 w-full px-6 pt-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="relative flex items-center justify-between h-12 max-w-lg mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-white/70 hover:text-white transition"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold" style={{ color: '#906EF6' }}>Edit Profile</h1>
                    <div className="w-6" /> {/* spacer */}
                </div>
            </motion.header>

            <main className="flex-grow w-full max-w-lg mx-auto px-6 py-8 space-y-6 overflow-y-auto">
                {/* Multi-Photo Grid */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <label className="block text-sm text-white/50 mb-3 font-medium">Photos (max 6)</label>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Existing photos */}
                        {photos.map((photo, i) => (
                            <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/10 group">
                                <img src={getImageUrl(photo)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                {i === 0 && (
                                    <div className="absolute top-1.5 left-1.5 bg-[#906EF6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        Main
                                    </div>
                                )}
                                <button
                                    onClick={() => handleRemovePhoto(i)}
                                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {/* Add photo slot */}
                        {photos.length < 6 && (
                            <button
                                onClick={() => addPhotoInputRef.current?.click()}
                                disabled={uploading}
                                className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/60 hover:border-[#906EF6]/50 transition-all"
                            >
                                {uploading ? (
                                    <div className="w-8 h-8 border-3 border-[#906EF6] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        <span className="text-xs mt-1">Add</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    <input
                        ref={addPhotoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAddPhoto}
                    />
                </motion.div>

                {/* Name Field */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <label className="block text-sm text-white/50 mb-2 font-medium">Name</label>
                    <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => { setProfile(p => ({ ...p, name: e.target.value })); setError(''); }}
                        className="w-full rounded-2xl px-5 py-3.5 border-none focus:outline-none focus:ring-2 focus:ring-[#906EF6]/50 transition-shadow placeholder-white/30"
                        style={inputStyle}
                        placeholder="Your name"
                    />
                </motion.div>

                {/* Instagram Field */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <label className="block text-sm text-white/50 mb-2 font-medium flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faInstagram} className="w-3.5 h-3.5" />
                        Instagram
                    </label>
                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 font-medium">@</span>
                        <input
                            type="text"
                            value={profile.instagramId || ''}
                            onChange={(e) => setProfile(p => ({ ...p, instagramId: e.target.value }))}
                            className="w-full rounded-2xl px-5 pl-10 py-3.5 border-none focus:outline-none focus:ring-2 focus:ring-[#906EF6]/50 transition-shadow placeholder-white/30"
                            style={inputStyle}
                            placeholder="your_username"
                        />
                    </div>
                </motion.div>

                {/* Error / Success Messages */}
                {error && (
                    <motion.p
                        className="text-red-400 text-sm text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >{error}</motion.p>
                )}

                {success && (
                    <motion.div
                        className="flex items-center justify-center gap-2 text-green-400 font-medium"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <span className="text-xl">✓</span>
                        <span>Profile updated!</span>
                    </motion.div>
                )}
            </main>

            {/* Save Button */}
            <motion.footer
                className="flex-shrink-0 w-full max-w-lg mx-auto px-6 pb-32 pt-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                <motion.button
                    onClick={handleSave}
                    disabled={saving || uploading || success}
                    className="w-full text-white font-bold py-4 px-8 rounded-3xl text-lg shadow-lg disabled:opacity-60"
                    style={{
                        background: 'linear-gradient(to right, #A78BFA, #8B5CF6)',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {saving ? 'Saving...' : success ? 'Saved ✓' : 'Save Changes'}
                </motion.button>
            </motion.footer>
            <BottomNavigation />
        </div>
    )
}

export default EditProfile
