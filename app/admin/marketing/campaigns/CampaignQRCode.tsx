'use client'

import { startTransition, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { QrCode, Download, Loader2 } from 'lucide-react'

interface CampaignQRCodeProps {
  url: string
  logoUrl?: string | null
}

export default function CampaignQRCode({ url, logoUrl }: CampaignQRCodeProps) {
  const [qrColor, setQrColor] = useState('#1a544a') // Neutral default; the store can customize it
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)


  const overlayLogoOnQr = (baseQr: string, logoSrc: string | null | undefined, color: string): Promise<string> => {
    return new Promise((resolve) => {
      const qrImg = new window.Image()
      qrImg.crossOrigin = 'anonymous'
      qrImg.onload = () => {
        const size = qrImg.width // 800
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!

        // Draw QR base
        ctx.drawImage(qrImg, 0, 0, size, size)

        // Logo area: 20% of QR size -> 160px for 800px QR
        const logoAreaSize = Math.round(size * 0.22)
        const cx = size / 2
        const cy = size / 2
        const radius = logoAreaSize / 2

        const drawFinish = () => {
          resolve(canvas.toDataURL('image/png'))
        }

        const drawLogo = (img: HTMLImageElement | null) => {
          // White circle backdrop with shadow
          ctx.save()
          ctx.shadowColor = 'rgba(0,0,0,0.15)'
          ctx.shadowBlur = 15
          ctx.beginPath()
          ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2)
          ctx.fillStyle = '#FFFFFF'
          ctx.fill()
          ctx.restore()

          // Fine border ring matching the QR color
          ctx.save()
          ctx.beginPath()
          ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2)
          ctx.strokeStyle = color
          ctx.lineWidth = 4
          ctx.stroke()
          ctx.restore()

          if (img) {
            // Clip to circle and draw logo
            ctx.save()
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.clip()
            // Using object-cover behavior logic
            const scale = Math.max(logoAreaSize / img.width, logoAreaSize / img.height)
            const w = img.width * scale
            const h = img.height * scale
            ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h)
            ctx.restore()
          } else {
            // Fallback: draw a generic store mark in the matching color
            ctx.save()
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
            ctx.font = `bold ${Math.round(logoAreaSize * 0.4)}px 'Georgia', serif`
            ctx.fillStyle = '#FFFFFF'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('STORE', cx, cy)
            ctx.restore()
          }
          drawFinish()
        }

        if (logoSrc) {
          const logoImg = new window.Image()
          logoImg.crossOrigin = 'anonymous'
          logoImg.onload = () => drawLogo(logoImg)
          logoImg.onerror = () => drawLogo(null)
          logoImg.src = logoSrc
        } else {
          drawLogo(null)
        }
      }
      qrImg.onerror = () => resolve(baseQr)
      qrImg.src = baseQr
    })
  }

  const overlayLogoOnQrRef = useRef(overlayLogoOnQr)

  // Generate QR whenever the campaign URL, logo, or color changes.
  useEffect(() => {
    if (!url) return

    const generateQr = async () => {
      setLoading(true)
      try {
        const baseDataUrl = await QRCode.toDataURL(url, {
          width: 800,
          margin: 2,
          color: { dark: qrColor, light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        })
        const finalDataUrl = await overlayLogoOnQrRef.current(baseDataUrl, logoUrl, qrColor)
        setQrDataUrl(finalDataUrl)
      } catch (error) {
        console.error('QR generation failed', error)
      } finally {
        setLoading(false)
      }
    }

    startTransition(() => {
      void generateQr()
    })
  }, [qrColor, url, logoUrl])

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'campaign-qrcode-hd.png'
    a.click()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6 mt-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <QrCode size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">كود QR للحملة (عالي الدقة)</h3>
          <p className="text-xs text-gray-500 mt-1">مثالي للمطبوعات، التغليف، والبطاقات المرفقة مع الطلبات.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* QR Preview */}
        <div className="relative shrink-0 border border-gray-100 rounded-xl p-4 bg-gray-50 flex items-center justify-center min-w-[240px] min-h-[240px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
              <Loader2 size={32} className="animate-spin text-brand" />
            </div>
          )}
          {qrDataUrl && (
            <Image src={qrDataUrl} alt="Campaign QR Code" width={220} height={220} className="shadow-sm bg-white p-2 rounded-lg" />
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-5 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">لون كود QR</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={qrColor}
                onChange={(e) => setQrColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 p-0"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              اختر لوناً يتناسب مع هوية الحملة (مثال: ذهبي لرمضان، أو أخضر داكن لهوية المتجر، أحمر لخصومات نهاية العام). سيتم دمج لون الكود مع إطار الصورة في المنتصف.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleDownloadQr}
              type="button"
              disabled={loading || !qrDataUrl}
              className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              <Download size={18} />
              تنزيل الكود للطباعة (PNG)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
