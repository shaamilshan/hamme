import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiService } from '../services/api'

// --- Icons ---
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.632 8.632a.75.75 0 01-1.06 1.06l-.353-.353v6.382a2.25 2.25 0 01-2.25 2.25H6.5a2.25 2.25 0 01-2.25-2.25v-6.382l-.353.353a.75.75 0 11-1.06-1.06L11.47 3.84z" />
  </svg>
)

const InboxIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
  </svg>
)

const LogoutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
)

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [hasInboxItems, setHasInboxItems] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  useEffect(() => {
    let intervalId: number | undefined

    const fetchInboxState = async () => {
      try {
        const [pending, matches] = await Promise.all([
          apiService.getPendingProfiles().catch(() => ({ data: { profiles: [] } })),
          apiService.getMatches().catch(() => ({ data: { matches: [] } }))
        ])
        const pendingCount = (pending as any)?.data?.profiles?.length || 0
        const matchesCount = (matches as any)?.data?.matches?.length || 0
        setHasInboxItems(pendingCount > 0 || matchesCount > 0)
      } catch {
        setHasInboxItems(false)
      }
    }

    fetchInboxState()

    const onFocus = () => fetchInboxState()
    window.addEventListener('focus', onFocus)

    intervalId = window.setInterval(fetchInboxState, 20000)

    return () => {
      window.removeEventListener('focus', onFocus)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [])

  return (
    <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <h1 className="text-2xl font-black tracking-tighter" style={{ color: '#906EF6' }}>HAMME</h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <motion.button
              onClick={() => navigate('/dashboard')}
              className={`p-2 transition-all duration-200 rounded-full hover:bg-white/10 ${location.pathname === '/dashboard'
                ? 'text-white bg-white/5'
                : 'text-white/60 hover:text-white'
                }`}
              aria-label="Home"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>

            <motion.button
              onClick={() => navigate('/inbox')}
              className={`relative p-2 transition-all duration-200 rounded-full hover:bg-white/10 ${location.pathname === '/inbox'
                ? 'text-white bg-white/5'
                : 'text-white/60 hover:text-white'
                }`}
              aria-label="Inbox"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <InboxIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              {/* Notification dot */}
              {hasInboxItems && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-black" style={{ backgroundColor: '#906EF6' }}></span>
              )}
            </motion.button>

            <div className="w-px h-4 bg-white/10 mx-1"></div>

            <motion.button
              onClick={handleLogout}
              className="p-2 text-white/40 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/10"
              aria-label="Logout"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogoutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header