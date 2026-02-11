import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiService } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import ProfileCard from './ProfileCard'
import Loader from './ui/Loader'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'

type FeedView = 'requests' | 'matches'

interface PendingProfile {
  user: {
    _id: string
    name: string
    age?: number
    profilePicture?: string
    dateOfBirth?: string
    instagramId?: string
  }
  choice: 'date' | 'friends'
  viewedAt: string
}

interface Match {
  matchId: string
  user: {
    _id: string
    name: string
    age?: number
    profilePicture?: string
    instagramId?: string
  }
  matchType: 'date' | 'friends'
  createdAt: string
}

interface InteractionFeedProps {
  onProfileResponse?: () => void
  onMatched?: (match: { matched: boolean; matchType: 'date' | 'friends'; matchId: string }) => void
  view: FeedView
}

function InteractionFeed({ onProfileResponse, onMatched, view }: InteractionFeedProps) {
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [pendingResponse, matchesResponse] = await Promise.all([
        apiService.getPendingProfiles(),
        apiService.getMatches()
      ])

      console.log('Pending profiles:', pendingResponse.data.profiles)
      console.log('Matches:', matchesResponse.data.matches)

      setPendingProfiles(pendingResponse.data.profiles)
      setMatches(matchesResponse.data.matches)
    } catch (error) {
      console.error('Failed to fetch interaction data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChoice = async (userId: string, choice: 'date' | 'friends' | 'reject') => {
    setSubmitting(userId)
    try {
      const response = await apiService.submitChoice(userId, choice)

      // Remove from pending list (diminish)
      setPendingProfiles(prev => prev.filter(p => p.user._id !== userId))

      // Refresh matches in case there's a new match
      const matchesResponse = await apiService.getMatches()
      setMatches(matchesResponse.data.matches)

      // Notify on mutual match
      if (response.data.match?.matched) {
        onMatched?.(response.data.match)
      }

      onProfileResponse?.()
    } catch (error) {
      console.error('Failed to submit choice:', error)
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader />
      </div>
    )
  }

  // Prepare up to 3 stacked requests (topmost is index 0)
  const stacked = pendingProfiles.slice(0, 3)

  const hoursLeft = (createdAt: string) => {
    const created = new Date(createdAt).getTime()
    const expires = created + 24 * 60 * 60 * 1000
    const ms = Math.max(0, expires - Date.now())
    const hours = Math.ceil(ms / (60 * 60 * 1000))
    return hours
  }

  return (
    <div className="space-y-6">
      {/* Matches Section */}
      {view === 'matches' && matches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Matched!</h3>
            <span className="text-xs text-white/50">Matches disappear in 24 hours</span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {matches.map((match, idx) => (
                <motion.div
                  key={match.matchId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-[#906EF6]/50 transition-colors ${match.user.instagramId ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (match.user.instagramId) {
                      window.open(`https://instagram.com/${match.user.instagramId}`, '_blank')
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#906EF6]/30">
                      {match.user.profilePicture ? (
                        <img
                          src={getImageUrl(match.user.profilePicture)}
                          alt={match.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {match.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm text-white font-semibold">
                        You matched with <span className="font-bold" style={{ color: '#906EF6' }}>{match.user.name}</span>
                      </p>
                      {match.user.instagramId && (
                        <p className="text-xs font-medium flex items-center gap-1 mt-0.5" style={{ color: '#906EF6' }}>
                          <FontAwesomeIcon icon={faInstagram} className="w-3 h-3" />
                          @{match.user.instagramId}
                        </p>
                      )}
                      <p className="text-xs text-white/50 mt-0.5">{hoursLeft(match.createdAt)} Hours left</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Pending Requests - Stacked pile */}
      {view === 'requests' && pendingProfiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            Play
          </h3>

          {/* Stack container sized to one card height; cards overlap via absolute positioning */}
          <div className="relative" style={{ height: '560px' }}>
            <AnimatePresence>
              {stacked.map((profile, idx) => {
                // Top card should be at the front (highest z), lower cards peek underneath
                const reverseIdx = stacked.length - 1 - idx
                const scale = 1 - reverseIdx * 0.04
                const topOffset = reverseIdx * 16 // px
                const z = 10 + idx
                const isTop = reverseIdx === 0

                return (
                  <motion.div
                    key={profile.user._id}
                    className="absolute left-0 right-0 mx-auto"
                    style={{ zIndex: z }}
                    initial={{ y: -50, opacity: 0, scale: scale }}
                    animate={{ y: topOffset, opacity: 1, scale: scale }}
                    exit={{ x: 200, opacity: 0, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: idx * 0.1 }}
                  >
                    <ProfileCard
                      userOverride={{
                        id: profile.user._id,
                        name: profile.user.name,
                        age: profile.user.age,
                        profilePicture: profile.user.profilePicture,
                        dateOfBirth: profile.user.dateOfBirth,
                        instagramId: profile.user.instagramId,
                      }}
                      showEdit={false}
                      subtitle="Sent you a request"
                      onDateClick={() => isTop && submitting !== profile.user._id && handleChoice(profile.user._id, 'date')}
                      onFriendsClick={() => isTop && submitting !== profile.user._id && handleChoice(profile.user._id, 'friends')}
                      onRejectClick={() => isTop && submitting !== profile.user._id && handleChoice(profile.user._id, 'reject')}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {view === 'requests' && pendingProfiles.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-4">👋</div>
          <h3 className="text-xl font-bold text-white mb-2">No requests yet</h3>
          <p className="text-white/60 text-sm">
            Share your profile to start getting views!
          </p>
        </motion.div>
      )}

      {view === 'matches' && matches.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-xl font-bold text-white mb-2">No matches yet</h3>
          <p className="text-white/60 text-sm">
            Mutually select an option to get matched. Matches last 24 hours.
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default InteractionFeed