import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
    </svg>
)

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
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

    return (
        <div className="min-h-screen bg-black flex justify-center font-sans">
            <div className="flex flex-col w-full max-w-md px-6 pt-14 pb-6">
                {/* Back arrow */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white transition-colors">
                        <ArrowLeftIcon className="w-7 h-7" />
                    </button>
                </motion.div>

                {/* Heading */}
                <motion.h1
                    className="text-[42px] leading-tight font-bold mt-4"
                    style={{ color: '#906EF6' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                >
                    What's your{'\n'}instagram id?
                </motion.h1>

                {/* Input */}
                <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                >
                    <input
                        type="text"
                        placeholder="@username"
                        value={instagramId}
                        onChange={(e) => {
                            setInstagramId(e.target.value)
                            if (error) setError('')
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleContinue()}
                        autoFocus
                        className="w-full rounded-2xl px-5 py-4 border-none focus:outline-none transition-shadow text-base"
                        style={{
                            backgroundColor: '#2C2C2E',
                            color: '#fff',
                            caretColor: '#906EF6',
                        }}
                    />
                    {error && <p className="text-red-400 text-xs mt-2 ml-1">{error}</p>}
                </motion.div>

                {/* Arrow button — centered in remaining space */}
                <div className="flex-grow flex items-center justify-center">
                    <motion.button
                        onClick={handleContinue}
                        disabled={isLoading}
                        className="w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-60"
                        style={{ backgroundColor: '#3A3A3C', color: '#8E8E93' }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
                        whileHover={{ backgroundColor: '#906EF6', color: '#000' }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <ArrowRightIcon className="w-6 h-6" style={{ color: 'inherit' }} />
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    )
}

export default SetupInstagram
