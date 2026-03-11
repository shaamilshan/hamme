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

const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.04l-.821 1.315z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
)

interface UserProfile {
    name: string
    instagramId?: string
    profilePicture?: string
}

function EditProfile() {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [profile, setProfile] = useState<UserProfile>({ name: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiService.getProfile()
                const user = res.data.user
                setProfile({
                    name: user.name || '',
                    instagramId: user.instagramId || '',
                    profilePicture: user.profilePicture || '',
                })
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

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Show preview immediately
        const preview = URL.createObjectURL(file)
        setPreviewUrl(preview)
        setUploading(true)

        try {
            const res = await apiService.uploadProfilePicture(file)
            setProfile(prev => ({ ...prev, profilePicture: res.data.fileUrl || res.data.user?.profilePicture }))
        } catch (err) {
            console.error('Upload failed:', err)
            setError('Failed to upload photo')
            setPreviewUrl(null)
        } finally {
            setUploading(false)
        }
    }

    const profileImageUrl = previewUrl || (profile.profilePicture ? getImageUrl(profile.profilePicture) : null)

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

            <main className="flex-grow w-full max-w-lg mx-auto px-6 py-8 space-y-6">
                {/* Profile Picture */}
                <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="relative group"
                        disabled={uploading}
                    >
                        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#906EF6]/40 shadow-lg shadow-[#906EF6]/10">
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#906EF6] to-purple-800 flex items-center justify-center">
                                    <span className="text-white text-3xl font-bold">{profile.name?.charAt(0)?.toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                        {/* Camera overlay */}
                        {!uploading && (
                            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </div>
                        )}
                        {/* Upload spinner */}
                        {uploading && (
                            <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                                <div className="w-10 h-10 border-4 border-[#906EF6] border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#906EF6] flex items-center justify-center shadow-lg">
                            <CameraIcon className="w-4 h-4 text-white" />
                        </div>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
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
                    className="w-full text-white font-bold py-4 px-8 rounded-full text-lg transition-opacity duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#906EF6', boxShadow: '0 10px 30px rgba(144, 110, 246, 0.3)' }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(144, 110, 246, 0.5)' }}
                    whileTap={{ scale: 0.97 }}
                >
                    {saving ? 'Saving...' : success ? 'Saved ✓' : 'Save Changes'}
                </motion.button>
            </motion.footer>
            <BottomNavigation />
        </div>
    )
}

export default EditProfile
