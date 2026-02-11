import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import InteractionFeed from '../components/InteractionFeed'

function Inbox() {
  const [matchModal, setMatchModal] = useState<null | { matchType: 'date' | 'friends'; matchId: string }>(null)
  const [view, setView] = useState<'requests' | 'matches'>('requests')

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-md mx-auto pt-24 pb-8 px-4">
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
            Hamme's
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
          onMatched={(match) => setMatchModal({ matchType: match.matchType, matchId: match.matchId })}
        />
      </main>

      {/* Match Modal */}
      <AnimatePresence>
        {matchModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">🎉</div>
                <h3 className="text-xl font-bold text-white mb-2">It's a Match!</h3>
                <p className="text-white/60 text-sm">
                  You both chose {matchModal.matchType === 'date' ? '💚 Dating' : '👥 Friendship'}. Matches disappear in 24 hours — don't wait!
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <motion.button
                  onClick={() => setMatchModal(null)}
                  className="px-5 py-2.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
                <motion.button
                  onClick={() => { setMatchModal(null); setView('matches') }}
                  className="px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-lg"
                  style={{ backgroundColor: '#906EF6' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Matches
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Inbox