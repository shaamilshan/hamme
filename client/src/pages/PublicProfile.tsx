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
  bio?: string
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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('Invalid profile link')
        setLoading(false)
        return
      }

      try {
        const response = await apiService.getPublicProfile(userId)
        setUser(response.data.user)
      } catch (error: any) {
        console.error('Failed to fetch profile:', error)
        setError(error.response?.data?.message || 'Profile not found')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/10 rounded-2xl backdrop-blur">
          <img src={logo} alt="Hamme" className="h-8 w-auto mx-auto mb-4 opacity-90" />
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-white/80 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            Go to Hamme
          </button>
        </div>
      </div>
    )
  }

  if (hasSubmitted && !matchResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/10 rounded-2xl backdrop-blur">
          <img src={logo} alt="Hamme" className="h-8 w-auto mx-auto mb-4 opacity-90" />
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Choice Submitted!</h2>
          <p className="text-white/80 mb-6">
            Your choice has been recorded. If {user?.name} makes the same choice, you'll be matched!
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (matchResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/10 rounded-2xl backdrop-blur">
          <img src={logo} alt="Hamme" className="h-8 w-auto mx-auto mb-4 opacity-90" />
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">It's a Match!</h2>
          <p className="text-white/80 mb-6">
            You and {user?.name} both chose "{matchResult.matchType}"! You can now start chatting.
          </p>
          <button
            onClick={() => navigate('/inbox')}
            className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            Go to Messages
          </button>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex flex-col items-center justify-center p-4 space-y-4">
      <img src={logo} alt="Hamme" className="h-8 w-auto opacity-90" />
      <p className="text-white/80 text-xs">Tap your choice below. Your selection is private.</p>
      <ProfileCard
        userOverride={{
          id: user.id,
          name: user.name,
          age: user.age,
          profilePicture: user.profilePicture,
        }}
        showEdit={false}
        onDateClick={() => !submitting && guardedChoice('date')}
        onFriendsClick={() => !submitting && guardedChoice('friends')}
        onRejectClick={() => !submitting && guardedChoice('reject')}
      />
    </div>
  )
}

export default PublicProfile