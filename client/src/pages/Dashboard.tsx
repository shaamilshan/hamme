import { useEffect, useState } from 'react'
import Header from '../components/Header'
import ProfileCard from '../components/ProfileCard'
import ShareActions from '../components/ShareActions'
import { apiService } from '../services/api'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [showNotification, setShowNotification] = useState<string | null>(null)
  const [pending, setPending] = useState<any[]>([])

  const handleDateClick = () => {
    setShowNotification('💚 Great choice! Looking for a date connection.')
    setTimeout(() => setShowNotification(null), 3000)
  }

  const handleFriendsClick = () => {
    setShowNotification('👥 Awesome! Making new friends is wonderful.')
    setTimeout(() => setShowNotification(null), 3000)
  }

  const handleRejectClick = () => {
    setShowNotification('❌ No worries! There are plenty of other connections.')
    setTimeout(() => setShowNotification(null), 3000)
  }

  const handleRequestAction = async (userId: string, choice: 'date' | 'friends' | 'reject') => {
    try {
      await apiService.submitChoice(userId, choice)
      // Remove from pending list
      setPending(prev => prev.filter(p => (p?.user?._id || p?._id) !== userId))

      const messages: Record<string, string> = {
        date: '💚 Great choice! You chose date.',
        friends: '👥 Awesome! You chose friends.',
        reject: '❌ No worries!'
      }
      setShowNotification(messages[choice])
      setTimeout(() => setShowNotification(null), 3000)
    } catch (error) {
      console.error('Failed to submit choice:', error)
    }
  }


  useEffect(() => {
    let intervalId: number | undefined

    const fetchPending = async () => {
      try {
        const res = await apiService.getPendingProfiles()
        setPending(res.data?.profiles || res.data || [])
      } catch (e) {
        console.error('Failed to load pending requests', e)
        setPending([])
      }
    }

    // initial fetch
    fetchPending()

    // refetch on window focus
    const onFocus = () => fetchPending()
    window.addEventListener('focus', onFocus)

    // light polling
    intervalId = window.setInterval(fetchPending, 15000)

    return () => {
      window.removeEventListener('focus', onFocus)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-6 py-3 max-w-sm">
            <p className="text-gray-800 text-center">{showNotification}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full md:max-w-none md:px-0 px-4 pb-12 pt-6 space-y-6">
        {/* Stacked Cards Container - Requests stack over user's profile */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm relative" style={{ minHeight: '560px' }}>
            {/* User's own profile card (base layer, no action icons) */}
            <div className="absolute inset-0" style={{ zIndex: 1 }}>
              <ProfileCard
                onDateClick={handleDateClick}
                onFriendsClick={handleFriendsClick}
                onRejectClick={handleRejectClick}
                draggable={false}
              />
            </div>

            {/* Pending request cards stacked on top */}
            {pending.slice(0, 3).map((p, idx) => {
              const reverseIdx = Math.min(pending.length, 3) - 1 - idx
              const scale = 1 - reverseIdx * 0.04
              const topOffset = reverseIdx * 16
              const z = 10 + idx
              const user = p?.user || p
              return (
                <div
                  key={user?._id || idx}
                  className="absolute left-0 right-0 mx-auto"
                  style={{ top: `${topOffset}px`, transform: `scale(${scale})`, zIndex: z }}
                >
                  <ProfileCard
                    userOverride={{
                      id: user?._id,
                      name: user?.name || 'New request',
                      age: user?.age,
                      profilePicture: user?.profilePicture,
                      dateOfBirth: user?.dateOfBirth,
                    }}
                    showEdit={false}
                    onDateClick={() => handleRequestAction(user?._id, 'date')}
                    onFriendsClick={() => handleRequestAction(user?._id, 'friends')}
                    onRejectClick={() => handleRequestAction(user?._id, 'reject')}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* View Requests Link (if there are more requests) */}
        {pending.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/inbox')}
              className="text-purple-600 font-medium text-sm hover:underline"
            >
              View all requests ({pending.length})
            </button>
          </div>
        )}

        {/* Share Actions */}
        <div className="flex justify-center">
          <ShareActions />
        </div>
      </main>
    </div>
  )
}

export default Dashboard