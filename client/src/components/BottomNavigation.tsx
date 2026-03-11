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

const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
)

function BottomNavigation() {
    const navigate = useNavigate()
    const location = useLocation()
    const [hasInboxItems, setHasInboxItems] = useState(false)

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
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
            <div className="bg-black/95 backdrop-blur-xl px-6 py-4">
                <div className="flex justify-between items-center w-full max-w-[320px] mx-auto">
                    {/* Dashboard */}
                    <motion.button
                        onClick={() => navigate('/dashboard')}
                        className={`p-2 transition-all duration-200 flex flex-col items-center justify-center ${location.pathname === '/dashboard'
                            ? 'text-[#906EF6]'
                            : 'text-white/40 hover:text-white/80'
                            }`}
                        whileTap={{ scale: 0.9 }}
                    >
                        <HomeIcon className="w-8 h-8" />
                    </motion.button>

                    {/* Inbox */}
                    <motion.button
                        onClick={() => navigate('/inbox')}
                        className={`relative p-2 transition-all duration-200 flex flex-col items-center justify-center ${location.pathname === '/inbox'
                            ? 'text-[#906EF6]'
                            : 'text-white/40 hover:text-white/80'
                            }`}
                        whileTap={{ scale: 0.9 }}
                    >
                        <div className="relative">
                            <InboxIcon className="w-8 h-8" />
                            {hasInboxItems && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black" style={{ backgroundColor: '#906EF6' }}></span>
                            )}
                        </div>
                    </motion.button>

                    {/* Profile */}
                    <motion.button
                        onClick={() => navigate('/edit-profile')}
                        className={`p-2 transition-all duration-200 flex flex-col items-center justify-center ${location.pathname === '/edit-profile'
                            ? 'text-[#906EF6]'
                            : 'text-white/40 hover:text-white/80'
                            }`}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ProfileIcon className="w-8 h-8" />
                    </motion.button>
                </div>
            </div>
        </div>
    )
}

export default BottomNavigation
