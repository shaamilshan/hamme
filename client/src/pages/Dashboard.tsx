import { useEffect, useState } from 'react'
import Header from '../components/Header'
import ProfileCard from '../components/ProfileCard'
import ShareActions from '../components/ShareActions'
import InteractionFeed from '../components/InteractionFeed'
import { apiService } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [showNotification, setShowNotification] = useState<string | null>(null)
  const [refreshFeed, setRefreshFeed] = useState(0)
  const [pending, setPending] = useState<any[]>([])
  const [loadingPending, setLoadingPending] = useState(true)

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

  const handleProfileResponse = () => {
    setRefreshFeed(prev => prev + 1)
  }

  useEffect(() => {
    let intervalId: number | undefined

    const fetchPending = async () => {
      try {
        setLoadingPending(true)
        const res = await apiService.getPendingProfiles()
        setPending(res.data?.profiles || res.data || [])
      } catch (e) {
        console.error('Failed to load pending requests', e)
        setPending([])
      } finally {
        setLoadingPending(false)
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
        {/* Profile Card */}
        <div className="flex justify-center">
          <ProfileCard
            onDateClick={handleDateClick}
            onFriendsClick={handleFriendsClick}
            onRejectClick={handleRejectClick}
          />
        </div>

        {/* Requests Peek */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-md">
            <button
              onClick={() => navigate('/inbox')}
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">Requests</h3>
                <span className="text-sm text-purple-600 font-medium">View all</span>
              </div>

              {/* Stacked cards */}
              <div className="relative h-28">
                {(pending.slice(0, 3)).map((p, idx) => {
                  const topOffset = (2 - idx) * 12
                  const scale = 1 - (2 - idx) * 0.06
                  const z = 10 + idx
                  const user = p?.user || p // handle both shapes gracefully
                  const img = user?.profilePicture ? getImageUrl(user.profilePicture) : ''
                  const name = user?.name || 'New request'
                  return (
                    <div
                      key={user?._id || idx}
                      className="absolute left-0 right-0 mx-auto rounded-2xl overflow-hidden shadow-md bg-gray-100"
                      style={{ top: `${topOffset}px`, transform: `scale(${scale})`, zIndex: z, height: '88px' }}
                    >
                      <div className="flex h-full">
                        <div className="w-28 h-full bg-gray-200 overflow-hidden">
                          {img ? (
                            <img src={img} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 font-semibold leading-5">{name}</p>
                            <p className="text-gray-500 text-sm">Sent you a request</p>
                          </div>
                          <span className="text-gray-400">›</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {(!loadingPending && pending.length === 0) && (
                  <div className="absolute inset-0 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
                    No requests yet
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Share Actions */}
        <div className="flex justify-center">
          <ShareActions />
        </div>
      </main>
    </div>
  )
}

export default Dashboard