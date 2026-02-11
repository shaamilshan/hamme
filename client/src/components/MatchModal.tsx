import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '../utils/imageUtils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'
import { faHeart, faUserFriends } from '@fortawesome/free-solid-svg-icons'

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

export default function MatchModal({ isOpen, onClose, myProfile, partnerProfile, matchType }: MatchModalProps) {


    // Determine colors and icons based on match type
    const isDate = matchType === 'date'
    const color = isDate ? '#10B981' : '#906EF6' // Emerald for Date, Purple for Friends
    const Icon = isDate ? faHeart : faUserFriends
    const label = isDate ? 'Dating' : 'Friends'

    return (
        <AnimatePresence>
            {isOpen && partnerProfile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-lg mx-4 z-10 flex flex-col items-center">

                        {/* Matched Text */}
                        <motion.div
                            initial={{ opacity: 0, y: -50, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="mb-12 text-center"
                        >
                            <h2 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transform -rotate-3">
                                MATCHED!
                            </h2>
                        </motion.div>

                        {/* Profiles Container */}
                        <div className="flex items-center justify-center w-full mb-12 relative h-40">

                            {/* My Profile - slides from left */}
                            <motion.div
                                initial={{ x: -150, opacity: 0, rotate: -15 }}
                                animate={{ x: -20, opacity: 1, rotate: -6 }}
                                transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.2 }}
                                className="absolute z-10"
                            >
                                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative">
                                    {myProfile?.profilePicture ? (
                                        <img
                                            src={getImageUrl(myProfile.profilePicture)}
                                            alt={myProfile.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">
                                                {myProfile?.name?.[0] || 'Me'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Partner Profile - slides from right */}
                            <motion.div
                                initial={{ x: 150, opacity: 0, rotate: 15 }}
                                animate={{ x: 20, opacity: 1, rotate: 6 }}
                                transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.2 }}
                                className="absolute z-10"
                            >
                                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative">
                                    {partnerProfile?.profilePicture ? (
                                        <img
                                            src={getImageUrl(partnerProfile.profilePicture)}
                                            alt={partnerProfile.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">
                                                {partnerProfile.name[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Reaction Icon - pops in center */}
                            <motion.div
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.6 }}
                                className="absolute z-20 bg-white rounded-full p-4 shadow-xl border-4 border-black"
                                style={{ color }}
                            >
                                <FontAwesomeIcon icon={Icon} className="text-3xl" />
                            </motion.div>

                        </div>

                        {/* Partner Name & Subtitle */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="text-center mb-8"
                        >
                            <p className="text-white text-lg">
                                You and <span className="font-bold">{partnerProfile.name}</span> match for
                                <span className="font-bold ml-1" style={{ color }}>{label}</span>!
                            </p>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="flex flex-col w-full max-w-xs gap-3"
                        >
                            {partnerProfile.instagramId ? (
                                <button
                                    onClick={() => window.open(`https://ig.me/m/${partnerProfile.instagramId}`, '_blank')}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95"
                                >
                                    <FontAwesomeIcon icon={faInstagram} className="text-xl" />
                                    Say "Hi" on Instagram
                                </button>
                            ) : (
                                <div className="text-white/60 text-center text-sm mb-2">
                                    No Instagram ID provided
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-white transition-colors"
                            >
                                Keep Playing
                            </button>
                        </motion.div>

                    </div>
                </div>
            )}
        </AnimatePresence>
    )
}
