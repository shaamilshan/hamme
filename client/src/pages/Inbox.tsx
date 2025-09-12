import { useState } from 'react'
import Header from '../components/Header'
import InteractionFeed from '../components/InteractionFeed'

function Inbox() {
  const [matchModal, setMatchModal] = useState<null | { matchType: 'date' | 'friends'; matchId: string }>(null)
  const [view, setView] = useState<'requests' | 'matches'>('requests')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-md mx-auto py-6 px-4">
        {/* Tabs */}
        <div className="flex items-center space-x-3 mb-5">
          <button
            onClick={() => setView('requests')}
            className={`flex-1 h-10 rounded-full border text-sm font-medium ${view === 'requests' ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-white text-gray-800 border-gray-200'}`}
          >
            Hamme’s
          </button>
          <button
            onClick={() => setView('matches')}
            className={`flex-1 h-10 rounded-full text-sm font-medium ${view === 'matches' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}
          >
            Matched !
          </button>
        </div>

        <InteractionFeed
          view={view}
          onMatched={(match) => setMatchModal({ matchType: match.matchType, matchId: match.matchId })}
        />
      </main>

      {matchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">🎉</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">It's a Match!</h3>
              <p className="text-gray-600 text-sm">
                You both chose {matchModal.matchType === 'date' ? '💚 Dating' : '👥 Friendship'}. Matches disappear in 24 hours — don't wait!
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setMatchModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => { setMatchModal(null); setView('matches') }}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                View Matches
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inbox