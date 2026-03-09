import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiService } from '../services/api'

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
        <div className="min-h-screen bg-black flex flex-col items-center justify-between px-6 py-16">
            <div className="w-full max-w-md flex-grow flex flex-col">
                {/* Heading */}
                <motion.h1
                    className="text-4xl font-bold text-white text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    What's your Instagram? 📸
                </motion.h1>

                {/* Input field */}
                <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
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
                        className="w-full bg-transparent text-white text-center text-lg px-5 py-4 rounded-2xl border-b-4 focus:outline-none"
                        style={{
                            backgroundColor: '#2C2C2E',
                            borderColor: '#906EF6',
                        }}
                    />
                    {error && (
                        <p className="text-red-400 text-sm text-center mt-2">{error}</p>
                    )}
                </motion.div>

                {/* Spacer */}
                <div className="flex-grow" />

                {/* Next button at bottom */}
                <motion.button
                    onClick={handleContinue}
                    disabled={isLoading}
                    className="w-full text-white font-bold py-4 px-8 rounded-3xl text-lg shadow-lg disabled:opacity-60"
                    style={{
                        background: 'linear-gradient(to right, #A78BFA, #8B5CF6)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isLoading ? 'Saving...' : 'Next'}
                </motion.button>
            </div>
        </div>
    )
}

export default SetupInstagram

