import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'
import QRCode from 'qrcode'
import logo from '../assets/Hamme-logo.png'

interface ShareActionsProps {
  profileUrl?: string
}

function ShareActions({ profileUrl }: ShareActionsProps) {
  const [copied, setCopied] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiService.getProfile()
        const id = response.data.user._id
        setUser(response.data.user)
        setUserId(id)
        const url = `${window.location.origin}/profile/${id}`
        setGeneratedUrl(url)
      } catch (error) {
        console.error('Failed to get user profile:', error)
        setError('Failed to generate profile link')
      } finally {
        setLoading(false)
      }
    }

    if (!profileUrl) {
      fetchUser()
    } else {
      setGeneratedUrl(profileUrl)
      setLoading(false)
    }
  }, [profileUrl])

  const shareUrl = profileUrl || generatedUrl

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

    // Story dimensions (9:16)
    canvas.width = 1080
    canvas.height = 1920

    // Background to match onboarding (bg-violet-600)
    ctx.fillStyle = '#7c3aed'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add Hamme logo at the top center
    try {
      const brand = new Image()
      brand.src = logo
      await new Promise<void>((resolve) => { brand.onload = () => resolve() ; brand.onerror = () => resolve() })
      const brandMaxW = 520
      const brandW = Math.min(brand.width || brandMaxW, brandMaxW)
      const scale = brandW / (brand.width || brandMaxW)
      const brandH = (brand.height || brandMaxW) * scale
      const bx = (canvas.width - brandW) / 2
      const by = 80
      // subtle shadow to pop on violet
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.25)'
      ctx.shadowBlur = 16
      ctx.drawImage(brand, bx, by, brandW, brandH)
      ctx.restore()
    } catch {}

    // Card container
    const cardW = 880
    const cardH = 1280
    const cardX = (canvas.width - cardW) / 2
    const cardY = 200

    // Card shadow
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 20

    // Card background
    ctx.fillStyle = '#ffffff'
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 36)
    ctx.fill()

    // Reset shadow for inner content
    ctx.shadowColor = 'transparent'

    // Image area
    const imgH = 980
    const imgW = cardW
    const imgX = cardX
    const imgY = cardY

    // Load profile image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const profilePath = user?.profilePicture || ''
    const imgUrl = profilePath ? (profilePath.startsWith('http') ? profilePath : `${base}${profilePath.startsWith('/') ? '' : '/'}${profilePath}`) : ''
    let imgLoaded = false
    if (imgUrl) {
      img.src = imgUrl
      await new Promise<void>((resolve) => { img.onload = () => { imgLoaded = true; resolve() } ; img.onerror = () => resolve() })
    }

    // Draw image or fallback gradient
    if (imgLoaded && img.naturalWidth > 0 && img.naturalHeight > 0) {
      // Cover
      const ratio = Math.max(imgW / img.width, imgH / img.height)
      const drawW = img.width * ratio
      const drawH = img.height * ratio
      const dx = imgX + (imgW - drawW) / 2
      const dy = imgY + (imgH - drawH) / 2

      // Clip to rounded top corners
      ctx.save()
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 36)
      ctx.clip()
      ctx.drawImage(img, dx, dy, drawW, drawH)
      ctx.restore()
    } else {
      const g = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH)
      g.addColorStop(0, '#8B5CF6')
      g.addColorStop(1, '#EC4899')
      ctx.fillStyle = g
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 36)
      ctx.fill()
    }

    // Footer area inside card
    const pad = 28
    const footerX = cardX + pad
    const footerY = cardY + imgH + 16
    const footerW = cardW - pad * 2

    // Name and age
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 48px Inter, Arial'
    const name = user?.name || 'Hamme User'
    ctx.fillText(name, footerX, footerY + 64)

    ctx.fillStyle = '#6B7280'
    ctx.font = '32px Inter, Arial'
    const age = user?.age ? `${user.age}` : ''
    if (age) ctx.fillText(age, footerX, footerY + 64 + 44)

    // Subtitle
    ctx.fillStyle = '#4B5563'
    ctx.font = '28px Inter, Arial'
    ctx.fillText('Find me on Hamme', footerX, footerY + 64 + 44 + 40)

    // QR code box
    const qrSize = 180
    const qrX = cardX + cardW - pad - qrSize
    const qrY = footerY + 20
    const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 0, width: qrSize })
    const qrImg = new Image()
    qrImg.src = qrDataUrl
    await new Promise<void>((resolve) => { qrImg.onload = () => resolve() })

    ctx.fillStyle = '#FFFFFF'
    drawRoundedRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16)
    ctx.fill()
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    // Footer branding
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '24px Inter, Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Scan or tap link in my bio', canvas.width / 2, cardY + cardH + 56)
    ctx.textAlign = 'left'

    // Return blob with fallback to toDataURL if needed
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
    if (blob) return blob
    const dataUrl = canvas.toDataURL('image/png')
    // Convert dataURL to Blob
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

      // Copy link to clipboard as a convenience
      if (shareUrl) {
        try { await navigator.clipboard.writeText(shareUrl) } catch {}
      }

      if (navigator.share && (navigator as any).canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Find me on Hamme',
          text: 'Check out my profile on Hamme',
        })
      } else {
        // Fallback: download image
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'hamme-story.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Share failed', e)
      setError('Sharing failed. Try copying the link instead.')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleCopyLink = async () => {
    const urlToCopy = shareUrl
    if (!urlToCopy || urlToCopy.includes('undefined')) {
      setError('Profile link not ready yet. Please try again.')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    try {
      await navigator.clipboard.writeText(urlToCopy)
      setCopied(true)
      setError('')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      const textArea = document.createElement('textarea')
      textArea.value = urlToCopy
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setError('')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Share to Instagram Story */}
      <button
        onClick={handleInstagramShare}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-3 disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faInstagram} className="w-6 h-6" />
        <span>{loading ? 'Loading...' : 'Share'}</span>
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        disabled={loading || !shareUrl}
        className="w-full bg-black text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-3 disabled:opacity-50"
      >
        <span className="text-2xl">{copied ? '✅' : '🔗'}</span>
        <span className="truncate">{loading ? 'Generating Link...' : copied ? 'Link Copied!' : 'Copy link'}</span>
      </button>
    </div>
  )
}

export default ShareActions