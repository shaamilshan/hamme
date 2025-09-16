import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import ProfileCard from './ProfileCard'
import Loader from './ui/Loader'

type FeedView = 'requests' | 'matches'

interface PendingProfile {
  user: {
    _id: string
    name: string
    age?: number
    profilePicture?: string
    dateOfBirth?: string
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
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Matched!</h3>
            <span className="text-xs text-gray-500">Matches disappear in 24 hours</span>
          </div>
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.matchId} className="bg-white rounded-lg shadow-sm p-4 border border-green-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    {match.user.profilePicture ? (
                      <img
                        src={getImageUrl(match.user.profilePicture)}
                        alt={match.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {match.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-gray-900 font-semibold">
                      You matched with <span className="text-purple-700 font-bold">{match.user.name}</span>
                    </p>
                    <p className="text-xs text-gray-500">{hoursLeft(match.createdAt)} Hours left</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests - Stacked pile */}
      {view === 'requests' && pendingProfiles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            Hamme’s
          </h3>

          {/* Stack container sized to one card height; cards overlap via absolute positioning */}
          <div className="relative" style={{ height: '560px' }}>
            {stacked.map((profile, idx) => {
              // Top card should be at the front (highest z), lower cards peek underneath
              const reverseIdx = stacked.length - 1 - idx
              const scale = 1 - reverseIdx * 0.04
              const topOffset = reverseIdx * 16 // px
              const z = 10 + idx
              const isTop = reverseIdx === 0

              return (
                <div
                  key={profile.user._id}
                  className="absolute left-0 right-0 mx-auto"
                  style={{ top: `${topOffset}px`, transform: `scale(${scale})`, zIndex: z }}
                >
                  <ProfileCard
                    userOverride={{
                      id: profile.user._id,
                      name: profile.user.name,
                      age: profile.user.age,
                      profilePicture: profile.user.profilePicture,
                      dateOfBirth: profile.user.dateOfBirth,
                    }}
                    showEdit={false}
                    subtitle="Sent you a request"
                    onDateClick={() => isTop && submitting !== profile.user._id && handleChoice(profile.user._id, 'date')}
                    onFriendsClick={() => isTop && submitting !== profile.user._id && handleChoice(profile.user._id, 'friends')}
                    onRejectClick={() => isTop && submitting !== profile.user._id && handleChoice(profile.user._id, 'reject')}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {view === 'requests' && pendingProfiles.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
          <p className="text-gray-600 text-sm">
            Share your profile to start getting views!
          </p>
        </div>
      )}

      {view === 'matches' && matches.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
          <p className="text-gray-600 text-sm">
            Mutually select an option to get matched. Matches last 24 hours.
          </p>
        </div>
      )}
    </div>
  )
}

export default InteractionFeed