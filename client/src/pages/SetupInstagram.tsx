import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
)

function SetupInstagram() {
    const navigate = useNavigate()
    const [instagramId, setInstagramId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleContinue = async () => {
        setIsLoading(true)
        setError('')

        try {
            if (instagramId.trim()) {
                await apiService.updateInstagramId(instagramId.trim())
            }
            navigate('/setup-profile-picture')
        } catch (err: any) {
            console.error('Error saving Instagram ID:', err)
            setError(err.response?.data?.message || 'Failed to save. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const inputStyle = {
        backgroundColor: 'rgba(144, 110, 246, 0.1)',
        color: '#fff',
    }

    return (
        <div className="min-h-screen bg-black flex flex-col font-sans p-6 text-white">
            <motion.header
                className="flex-shrink-0 w-full"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div className="relative flex items-center justify-between h-14">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-white/70 hover:text-white transition"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <div className="flex-1" />
                    {/* step indicator */}
                    <div className="w-24 h-1 rounded-full bg-white/20">
                        <div className="h-1 w-12 rounded-full" style={{ backgroundColor: '#906EF6' }} />
                    </div>
                </div>
            </motion.header>

            <main className="flex-grow flex items-center justify-center w-full">
                <motion.div
                    className="w-full max-w-lg mx-auto p-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <FontAwesomeIcon icon={faInstagram} className="w-8 h-8" style={{ color: '#906EF6' }} />
                        <h1 className="text-3xl font-bold" style={{ color: '#906EF6' }}>What's your Instagram?</h1>
                    </div>
                    <p className="text-sm text-white/70 mb-8">This will be shown on your profile card. You can skip this.</p>

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
                    >
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 font-medium text-lg">@</span>
                            <input
                                type="text"
                                placeholder="your_username"
                                value={instagramId}
                                onChange={(e) => { setInstagramId(e.target.value); setError(''); }}
                                className="w-full rounded-full px-6 pl-12 py-4 text-lg border-none focus:outline-none focus:ring-2 transition-shadow placeholder-white/30"
                                style={inputStyle}
                                autoFocus
                            />
                        </div>
                    </motion.div>

                    {error && (
                        <p className="text-red-400 text-sm text-center mt-3">{error}</p>
                    )}
                </motion.div>
            </main>

            <motion.footer
                className="flex-shrink-0 w-full max-w-md mx-auto mt-auto pt-6"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            >
                <motion.button
                    onClick={handleContinue}
                    disabled={isLoading}
                    className="w-full text-white font-bold py-4 px-8 rounded-full text-lg transition-opacity duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#906EF6', boxShadow: '0 10px 30px rgba(144, 110, 246, 0.3)' }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(144, 110, 246, 0.5)' }}
                    whileTap={{ scale: 0.97 }}
                >
                    {isLoading ? 'Saving...' : instagramId.trim() ? 'Continue' : 'Skip'}
                </motion.button>
                <p className="text-xs text-center mt-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    You can always update this later
                </p>
            </motion.footer>
        </div>
    )
}

export default SetupInstagram
