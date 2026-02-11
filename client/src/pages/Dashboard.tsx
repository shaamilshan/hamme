import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import ProfileCard from '../components/ProfileCard'
import ShareActions from '../components/ShareActions'
import MatchModal from '../components/MatchModal'
import { apiService } from '../services/api'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [showNotification, setShowNotification] = useState<string | null>(null)
  const [pending, setPending] = useState<any[]>([])
  const [myProfile, setMyProfile] = useState<any>(null)
  const [matchModal, setMatchModal] = useState<{ isOpen: boolean; partner: any; matchType: 'date' | 'friends' }>({
    isOpen: false,
    partner: null,
    matchType: 'date'
  })

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
      // Find user before removing
      const matchedUser = pending.find(p => (p?.user?._id || p?._id || p?.user) === userId)
      const partner = matchedUser?.user || matchedUser

      const response = await apiService.submitChoice(userId, choice)
      // Remove from pending list
      setPending(prev => prev.filter(p => (p?.user?._id || p?._id) !== userId))

      if (response.data?.match?.matched) {
        setMatchModal({
          isOpen: true,
          partner: partner,
          matchType: choice as 'date' | 'friends'
        })
      } else {
        const messages: Record<string, string> = {
          date: '💚 Great choice! Looking for a date connection.',
          friends: '👥 Awesome! Making new friends is wonderful.',
          reject: '❌ No worries!'
        }
        setShowNotification(messages[choice])
        setTimeout(() => setShowNotification(null), 3000)
      }
    } catch (error) {
      console.error('Failed to submit choice:', error)
    }
  }


  useEffect(() => {
    let intervalId: number | undefined

    const fetchPending = async () => {
      try {
        const [pendingRes, profileRes] = await Promise.all([
          apiService.getPendingProfiles(),
          !myProfile ? apiService.getProfile() : Promise.resolve({ data: { user: myProfile } })
        ])
        setPending(pendingRes.data?.profiles || pendingRes.data || [])
        if (profileRes.data?.user) {
          setMyProfile(profileRes.data.user)
        }
      } catch (e) {
        // ...
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
    <div className="min-h-screen bg-black">
      <Header />

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 w-full max-w-sm px-4 pointer-events-none"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-2xl px-6 py-3">
              <p className="text-white font-medium text-center">{showNotification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="w-full md:max-w-none md:px-0 px-4 pb-12 pt-24 space-y-8 overflow-x-hidden">
        {/* Stacked Cards Container - Requests stack over user's profile */}
        <div className="flex justify-center">
          <motion.div
            className="w-full max-w-sm relative"
            style={{ minHeight: '560px' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* User's own profile card (base layer, no action icons) */}
            <div className="absolute inset-0" style={{ zIndex: 1 }}>
              <ProfileCard
                onDateClick={handleDateClick}
                onFriendsClick={handleFriendsClick}
                onRejectClick={handleRejectClick}
                showActions={false}
                draggable={false}
              />
            </div>

            {/* Pending request cards stacked on top */}
            <AnimatePresence>
              {pending.slice(0, 3).map((p, idx) => {
                const reverseIdx = Math.min(pending.length, 3) - 1 - idx
                const scale = 1 - reverseIdx * 0.04
                const topOffset = reverseIdx * 16
                const z = 10 + idx
                const user = p?.user || p
                return (
                  <motion.div
                    key={user?._id || idx}
                    className="absolute left-0 right-0 mx-auto"
                    style={{ zIndex: z }}
                    initial={{ y: -50, opacity: 0, scale: scale }}
                    animate={{ y: topOffset, opacity: 1, scale: scale }}
                    exit={{ x: 200, opacity: 0, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: idx * 0.1 }}
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
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* View Requests Link (if there are more requests) */}
        {pending.length > 0 && (
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={() => navigate('/inbox')}
              className="font-medium text-sm hover:underline transition-colors"
              style={{ color: '#906EF6' }}
              whileHover={{ scale: 1.05, opacity: 0.9 }}
              whileTap={{ scale: 0.95 }}
            >
              View all requests ({pending.length})
            </motion.button>
          </motion.div>
        )}

        {/* Share Actions */}
        <motion.div
          className="flex justify-center pb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <ShareActions />
        </motion.div>
      </main>

      <MatchModal
        isOpen={matchModal.isOpen}
        onClose={() => setMatchModal(prev => ({ ...prev, isOpen: false }))}
        myProfile={myProfile}
        partnerProfile={matchModal.partner}
        matchType={matchModal.matchType as 'date' | 'friends'}
      />
    </div>
  )
}

export default Dashboard