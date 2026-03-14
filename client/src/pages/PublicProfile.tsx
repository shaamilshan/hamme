import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import ProfileCard from '../components/ProfileCard'
import Loader from '../components/ui/Loader'
import logo from '../assets/Hamme-logo.png'

interface User {
  id: string
  name: string
  age?: number
  profilePicture?: string
  instagramId?: string
  bio?: string
  photos?: string[]
}

interface ExistingVote {
  choice: 'date' | 'friends' | 'reject'
  votedAt: string
  expiresAt: string
}

function PublicProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [matchResult, setMatchResult] = useState<any>(null)
  const [existingVote, setExistingVote] = useState<ExistingVote | null>(null)

  const fetchProfile = async () => {
    if (!userId) {
      setError('Invalid profile link')
      setLoading(false)
      return
    }

    try {
      const response = await apiService.getPublicProfile(userId)
      setUser(response.data.user)
      setExistingVote(response.data.existingVote || null)
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      setError(error.response?.data?.message || 'Profile not found')
    } finally {
      setLoading(false)
    }
  }

  const isVoteExpired = () => {
    if (!existingVote) return true
    return new Date(existingVote.expiresAt).getTime() <= Date.now()
  }

  const getTimeRemaining = () => {
    if (!existingVote) return ''
    const expiresAt = new Date(existingVote.expiresAt).getTime()
    const now = Date.now()
    const remaining = expiresAt - now

    if (remaining <= 0) return 'Expired'

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  useEffect(() => {
    fetchProfile()
  }, [userId])

  // Set up timer to check vote expiration
  useEffect(() => {
    if (!existingVote) return

    const checkExpiration = () => {
      if (isVoteExpired()) {
        setExistingVote(null)
      }
    }

    const interval = setInterval(checkExpiration, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [existingVote])

  const guardedChoice = async (choice: 'date' | 'friends' | 'reject') => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signup', {
        state: {
          returnTo: `/profile/${userId}`,
          message: 'Sign up to interact with this profile!'
        }
      })
      return
    }

    if (!userId) return

    setSubmitting(true)
    try {
      const response = await apiService.submitChoice(userId, choice)
      setHasSubmitted(true)

      if (response.data.match) {
        setMatchResult(response.data.match)
      }

    } catch (error: any) {
      console.error('Failed to submit choice:', error)
      setError(error.response?.data?.message || 'Failed to submit choice')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full mx-auto p-8 rounded-2xl">
          <img src={logo} alt="Hamme" className="h-10 w-auto mx-auto mb-8 drop-shadow-[0_0_15px_rgba(144,110,246,0.5)]" />
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-white/80 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-white text-black px-6 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors duration-200"
          >
            Go to Hamme
          </button>
        </div>
      </div>
    )
  }

  if (hasSubmitted && !matchResult) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full mx-auto p-8 rounded-2xl">
          <img src={logo} alt="Hamme" className="h-10 w-auto mx-auto mb-8 drop-shadow-[0_0_15px_rgba(144,110,246,0.5)]" />
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Choice Submitted!</h2>
          <p className="text-white/80 mb-6">
            Your choice has been recorded. If {user?.name} makes the same choice, you'll be matched!
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-white text-black px-6 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (matchResult) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md w-full mx-auto p-8 rounded-2xl">
          <img src={logo} alt="Hamme" className="h-10 w-auto mx-auto mb-8 drop-shadow-[0_0_15px_rgba(144,110,246,0.5)]" />
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">It's a Match!</h2>
          <p className="text-white/80 mb-8">
            You and {user?.name} both chose "{matchResult.matchType}"! You can now start chatting.
          </p>
          <button
            onClick={() => navigate('/inbox')}
            className="w-full bg-white text-black px-6 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors duration-200"
          >
            Go to Messages
          </button>
        </div>
      </div>
    )
  }

  // Show "Already Voted" state if user has voted and vote hasn't expired
  if (existingVote && !isVoteExpired()) {
    const getChoiceEmoji = (choice: string) => {
      switch (choice) {
        case 'date': return '💚'
        case 'friends': return '👥'
        case 'reject': return '❌'
        default: return '✅'
      }
    }

    const getChoiceText = (choice: string) => {
      switch (choice) {
        case 'date': return 'Dating'
        case 'friends': return 'Friendship'
        case 'reject': return 'Not Interested'
        default: return choice
      }
    }

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md w-full mx-auto p-8 rounded-2xl">
          <img src={logo} alt="Hamme" className="h-10 w-auto mx-auto mb-8 drop-shadow-[0_0_15px_rgba(144,110,246,0.5)]" />
          <div className="text-6xl mb-4">{getChoiceEmoji(existingVote.choice)}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Already Voted</h2>
          <p className="text-white/80 mb-4">
            You chose "{getChoiceText(existingVote.choice)}" for {user?.name}
          </p>
          <p className="text-white/60 text-sm mb-8">
            You can vote again in {getTimeRemaining()}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-white text-black px-6 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black flex flex-col p-4 w-full">
      {/* Top Header - Matches Dashboard */}
      <div className="flex justify-between items-center w-full mb-6 mt-2 relative z-50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Hamme" className="h-8 w-auto drop-shadow-[0_0_15px_rgba(144,110,246,0.5)]" />
          <span className="text-white font-bold text-xl tracking-wide">Hamme</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto relative h-[calc(100vh-140px)] min-h-[500px]">
        <ProfileCard
          userOverride={{
            id: user.id,
            name: user.name,
            age: user.age,
            profilePicture: user.profilePicture,
            instagramId: user.instagramId,
            photos: user.photos || (user.profilePicture ? [user.profilePicture] : []),
          }}
          showEdit={false}
          onDateClick={() => !submitting && guardedChoice('date')}
          onFriendsClick={() => !submitting && guardedChoice('friends')}
          onRejectClick={() => !submitting && guardedChoice('reject')}
        />
        <p className="text-white/60 text-xs mt-6 text-center">Tap your choice below. Your selection is private.</p>
      </div>
    </div>
  )
}

export default PublicProfile