import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import BottomNavigation from '../components/BottomNavigation'
import ProfileCard from '../components/ProfileCard'
import MatchModal from '../components/MatchModal'
import { apiService } from '../services/api'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import logo from '../assets/Hamme-logo.png'

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
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

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

  // Generate share URL when profile loads
  useEffect(() => {
    if (myProfile?._id) {
      setShareUrl(`${window.location.origin}/profile/${myProfile._id}`)
    }
  }, [myProfile])

  // --- Share helpers ---
  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  const createStoryImage = async (): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 1080
    canvas.height = 1920
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    try {
      const brand = new Image()
      brand.src = logo
      await new Promise<void>((resolve) => { brand.onload = () => resolve(); brand.onerror = () => resolve() })
      const brandMaxW = 520
      const brandW = Math.min(brand.width || brandMaxW, brandMaxW)
      const scale = brandW / (brand.width || brandMaxW)
      const brandH = (brand.height || brandMaxW) * scale
      const bx = (canvas.width - brandW) / 2
      const by = 80
      ctx.save()
      ctx.shadowColor = 'rgba(144, 110, 246, 0.5)'
      ctx.shadowBlur = 20
      ctx.drawImage(brand, bx, by, brandW, brandH)
      ctx.restore()
    } catch { }

    const cardW = 880, cardH = 1280
    const cardX = (canvas.width - cardW) / 2, cardY = 200
    ctx.shadowColor = 'rgba(144, 110, 246, 0.15)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 20
    ctx.fillStyle = '#111111'
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 36)
    ctx.fill()
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.shadowColor = 'transparent'

    const imgH = 980, imgW = cardW, imgX = cardX, imgY = cardY
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const profilePath = myProfile?.profilePicture || ''
    const imgUrl = profilePath ? (profilePath.startsWith('http') ? profilePath : `${base}${profilePath.startsWith('/') ? '' : '/'}${profilePath}`) : ''
    let imgLoaded = false
    if (imgUrl) {
      img.src = imgUrl
      await new Promise<void>((resolve) => { img.onload = () => { imgLoaded = true; resolve() }; img.onerror = () => resolve() })
    }

    if (imgLoaded && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const ratio = Math.max(imgW / img.width, imgH / img.height)
      const drawW = img.width * ratio, drawH = img.height * ratio
      const dx = imgX + (imgW - drawW) / 2, dy = imgY + (imgH - drawH) / 2
      ctx.save()
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 36)
      ctx.clip()
      ctx.drawImage(img, dx, dy, drawW, drawH)
      ctx.restore()
    } else {
      const g = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH)
      g.addColorStop(0, '#906EF6')
      g.addColorStop(1, '#000000')
      ctx.fillStyle = g
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 36)
      ctx.fill()
    }

    const pad = 28, footerX = cardX + pad, footerY = cardY + imgH + 16
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 48px Inter, Arial'
    ctx.fillText(myProfile?.name || 'Hamme User', footerX, footerY + 64)
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '32px Inter, Arial'
    if (myProfile?.age) ctx.fillText(`${myProfile.age}`, footerX, footerY + 64 + 44)
    ctx.fillStyle = '#906EF6'
    ctx.font = '28px Inter, Arial'
    ctx.fillText('Find me on Hamme', footerX, footerY + 64 + 44 + 40)

    const qrSize = 180
    const qrX = cardX + cardW - pad - qrSize, qrY = footerY + 20
    const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: qrSize, color: { dark: '#000000', light: '#FFFFFF' } })
    const qrImg = new Image()
    qrImg.src = qrDataUrl
    await new Promise<void>((resolve) => { qrImg.onload = () => resolve() })
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    ctx.fillStyle = '#666666'
    ctx.font = '24px Inter, Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Scan or tap link in my bio', canvas.width / 2, cardY + cardH + 56)
    ctx.textAlign = 'left'

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
    if (blob) return blob
    const dataUrl = canvas.toDataURL('image/png')
    const byteString = atob(dataUrl.split(',')[1])
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
    return new Blob([ab], { type: mimeString })
  }

  const handleInstagramShare = async () => {
    try {
      const blob = await createStoryImage()
      const file = new File([blob], 'hamme-story.png', { type: 'image/png' })
      if (shareUrl) {
        try { await navigator.clipboard.writeText(shareUrl) } catch { }
      }
      if (navigator.share && (navigator as any).canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Find me on Hamme', text: 'Check out my profile on Hamme' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'hamme-story.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Share failed', e)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl || shareUrl.includes('undefined')) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

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
      <main className="w-full md:max-w-none md:px-0 px-4 pb-32 pt-24 space-y-8 overflow-x-hidden">
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
                onInstagramShare={handleInstagramShare}
                onCopyLink={handleCopyLink}
                linkCopied={copied}
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


      </main>

      <MatchModal
        isOpen={matchModal.isOpen}
        onClose={() => setMatchModal(prev => ({ ...prev, isOpen: false }))}
        myProfile={myProfile}
        partnerProfile={matchModal.partner}
        matchType={matchModal.matchType as 'date' | 'friends'}
      />
      <BottomNavigation />
    </div>
  )
}

export default Dashboard