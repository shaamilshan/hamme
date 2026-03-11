import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import BottomNavigation from '../components/BottomNavigation'
import InteractionFeed from '../components/InteractionFeed'
import MatchModal from '../components/MatchModal'
import { apiService } from '../services/api'

function Inbox() {
  const [matchModal, setMatchModal] = useState<{ isOpen: boolean; partner: any; matchType: 'date' | 'friends' }>({
    isOpen: false,
    partner: null,
    matchType: 'date'
  })
  const [myProfile, setMyProfile] = useState<any>(null)

  useEffect(() => {
    apiService.getProfile()
      .then(res => setMyProfile(res.data?.user))
      .catch(console.error)
  }, [])
  const [view, setView] = useState<'requests' | 'matches'>('requests')

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-md mx-auto pt-24 pb-32 px-4">
        {/* Tabs */}
        <motion.div
          className="flex items-center space-x-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.button
            onClick={() => setView('requests')}
            className={`flex-1 h-10 rounded-full text-sm font-semibold transition-colors duration-200 ${view === 'requests'
              ? 'text-white border border-white/20'
              : 'text-white/50 border border-white/10 hover:text-white/70'
              }`}
            style={view === 'requests' ? { backgroundColor: 'rgba(144, 110, 246, 0.2)' } : {}}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Play
          </motion.button>
          <motion.button
            onClick={() => setView('matches')}
            className={`flex-1 h-10 rounded-full text-sm font-semibold transition-colors duration-200 ${view === 'matches'
              ? 'text-white'
              : 'text-white/50 border border-white/10 hover:text-white/70'
              }`}
            style={view === 'matches' ? { backgroundColor: '#906EF6' } : {}}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Matched !
          </motion.button>
        </motion.div>

        <InteractionFeed
          view={view}
          onMatched={(match) => setMatchModal({
            isOpen: true,
            matchType: match.matchType,
            partner: match.user
          })}
        />
      </main>

      {/* Match Modal */}
      <MatchModal
        isOpen={matchModal.isOpen}
        onClose={() => setMatchModal(prev => ({ ...prev, isOpen: false }))}
        myProfile={myProfile}
        partnerProfile={matchModal.partner}
        matchType={matchModal.matchType}
      />
      <BottomNavigation />
    </div>
  )
}

export default Inbox