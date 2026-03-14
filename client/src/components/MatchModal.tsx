import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '../utils/imageUtils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'

interface MatchModalProps {
    isOpen: boolean
    onClose: () => void
    myProfile?: {
        name: string
        profilePicture?: string
    }
    partnerProfile?: {
        name: string
        profilePicture?: string
        instagramId?: string
    }
    matchType: 'date' | 'friends'
}

// Floating heart/sparkle particles
function Particles({ color }: { color: string }) {
    const particles = Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360
        const radius = 120 + Math.random() * 80
        const x = Math.cos((angle * Math.PI) / 180) * radius
        const y = Math.sin((angle * Math.PI) / 180) * radius
        const size = 6 + Math.random() * 10
        const delay = 0.4 + Math.random() * 0.4
        return { x, y, size, delay, id: i }
    })

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{ scale: [0, 1.2, 0], x: p.x, y: p.y, opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
                    className="absolute rounded-full"
                    style={{
                        width: p.size,
                        height: p.size,
                        background: p.id % 3 === 0 ? color : p.id % 3 === 1 ? '#f472b6' : '#a78bfa',
                    }}
                />
            ))}
        </div>
    )
}

export default function MatchModal({ isOpen, onClose, myProfile, partnerProfile, matchType }: MatchModalProps) {
    const [showContent, setShowContent] = useState(false)

    const isDate = matchType === 'date'
    const color = isDate ? '#10B981' : '#906EF6'
    const label = isDate ? 'Dating' : 'Friends'

    // Stagger: show backdrop first, then content
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setShowContent(true), 200)
            return () => clearTimeout(timer)
        } else {
            setShowContent(false)
        }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && partnerProfile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto">
                    {/* Backdrop with radial glow */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        onClick={onClose}
                        className="absolute inset-0"
                        style={{
                            backgroundColor: '#000000',
                            backgroundImage: `radial-gradient(circle at 50% 40%, #906EF630 0%, transparent 60%)`,
                        }}
                    />

                    {/* Particles burst */}
                    {showContent && <Particles color={color} />}

                    {/* Modal Content */}
                    {showContent && (
                        <div className="relative w-full max-w-lg mx-4 z-10 flex flex-col items-center">

                            {/* Glow ring behind cards */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 0.3 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="absolute top-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
                                style={{ background: '#906EF6' }}
                            />

                            {/* MATCHED! Text */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.3, y: -30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 15,
                                    delay: 0.1,
                                }}
                                className="mb-10 text-center px-4 overflow-visible"
                            >
                                <motion.h2
                                    animate={{
                                        textShadow: [
                                            '0 0 20px rgba(168,85,247,0)',
                                            '0 0 40px rgba(168,85,247,0.5)',
                                            '0 0 20px rgba(168,85,247,0)',
                                        ],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transform -rotate-3 py-2 px-2"
                                >
                                    MATCHED!
                                </motion.h2>
                            </motion.div>

                            {/* Profile Cards */}
                            <div className="relative flex items-start justify-center w-full mb-10">

                                {/* My Profile - slides from far left */}
                                <motion.div
                                    initial={{ x: -200, opacity: 0, rotate: -30, scale: 0.6 }}
                                    animate={{ x: 0, opacity: 1, rotate: -6, scale: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 120,
                                        damping: 14,
                                        delay: 0.3,
                                    }}
                                    className="flex flex-col items-center z-10 mr-[-20px]"
                                >
                                    <motion.div
                                        animate={{ boxShadow: [`0 0 0px ${color}`, `0 0 25px ${color}80`, `0 0 0px ${color}`] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                                        className="w-36 h-48 rounded-2xl overflow-hidden border-[3px] border-white/80"
                                    >
                                        {myProfile?.profilePicture ? (
                                            <img
                                                src={getImageUrl(myProfile.profilePicture)}
                                                alt={myProfile.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-white">
                                                    {myProfile?.name?.[0] || 'Me'}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                </motion.div>

                                {/* Partner Profile - slides from far right */}
                                <motion.div
                                    initial={{ x: 200, opacity: 0, rotate: 30, scale: 0.6 }}
                                    animate={{ x: 0, opacity: 1, rotate: 6, scale: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 120,
                                        damping: 14,
                                        delay: 0.3,
                                    }}
                                    className="flex flex-col items-center z-10 ml-[-20px]"
                                >
                                    <motion.div
                                        animate={{ boxShadow: [`0 0 0px ${color}`, `0 0 25px ${color}80`, `0 0 0px ${color}`] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 1.0 }}
                                        className="w-36 h-48 rounded-2xl overflow-hidden border-[3px] border-white/80"
                                    >
                                        {partnerProfile?.profilePicture ? (
                                            <img
                                                src={getImageUrl(partnerProfile.profilePicture)}
                                                alt={partnerProfile.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-white">
                                                    {partnerProfile.name[0]}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                </motion.div>

                            </div>

                            {/* Match text */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9, duration: 0.5 }}
                                className="text-center mb-8"
                            >
                                <p className="text-white text-lg">
                                    You and <span className="font-bold">{partnerProfile.name}</span> match for
                                    <span className="font-bold ml-1" style={{ color }}>{label}</span>!
                                </p>
                            </motion.div>

                            {/* Actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.1, duration: 0.5 }}
                                className="flex flex-col w-full max-w-xs gap-3"
                            >
                                {partnerProfile.instagramId ? (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => window.open(`https://ig.me/m/${partnerProfile.instagramId}`, '_blank')}
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faInstagram} className="text-xl" />
                                        Say "Hi" on Instagram
                                    </motion.button>
                                ) : (
                                    <div className="text-white/60 text-center text-sm mb-2">
                                        No Instagram ID provided
                                    </div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onClose}
                                    className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-white transition-colors"
                                >
                                    Keep Playing
                                </motion.button>
                            </motion.div>

                        </div>
                    )}
                </div>
            )}
        </AnimatePresence>
    )
}
