import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiService } from '../services/api'
import logo from '../assets/Hamme-logo.png'

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
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src={logo} alt="Hamme" className="h-8 w-auto" />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate('/dashboard')}
              className={`text-lg font-medium transition-colors duration-200 ${
                location.pathname === '/dashboard' 
                  ? 'text-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Home
            </button>
            
            <button
              onClick={() => navigate('/inbox')}
              className={`relative text-lg font-medium transition-colors duration-200 ${
                location.pathname === '/inbox' 
                  ? 'text-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Inbox
              {/* Notification dot (only when there are inbox items) */}
              {hasInboxItems && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header