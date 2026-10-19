'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  X, 
  Check, 
  RotateCw, 
  ZoomIn, 
  Scissors, 
  Sparkles
} from 'lucide-react'
import { compressImageClientSide } from '@/lib/compress'

interface ImageEditorModalProps {
  isOpen: boolean
  imageUrl: string
  onClose: () => void
  onSave: (newBlobUrl: string, newFile: File) => void
}

export default function ImageEditorModal({
  isOpen,
  imageUrl,
  onClose,
  onSave,
}: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageObjRef = useRef<HTMLImageElement | null>(null)

  // Editor states
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [blurIntensity, setBlurIntensity] = useState(0) // 0 to 100
  const [vignetteDarkness, setVignetteDarkness] = useState(0) // 0 to 100
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | 'free'>('1:1')
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isProcessing, setIsProcessing] = useState(false)

  // Canvas renderer with blur, vignette and crop logic
  const renderCanvas = useCallback((
    img: HTMLImageElement,
    currentZoom: number,
    currentRotation: number,
    blur: number,
    vignette: number,
    currentPan: { x: number; y: number },
    ratio: '1:1' | '4:5' | 'free'
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Target canvas dimensions (standard square or 4:5 for fashion)
    const baseSize = 800
    let targetWidth = baseSize
    let targetHeight = baseSize

    if (ratio === '4:5') {
      targetWidth = 800
      targetHeight = 1000
    } else if (ratio === 'free') {
      targetWidth = img.naturalWidth || 800
      targetHeight = img.naturalHeight || 800
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    ctx.clearRect(0, 0, targetWidth, targetHeight)

    // 1. If background blur is applied, draw a heavily blurred & darkened background layer first
    if (blur > 0) {
      ctx.save()
      ctx.filter = `blur(${Math.round(blur * 0.4)}px) brightness(${1 - (vignette * 0.003)})`
      const bgScale = 1.3
      const bgW = targetWidth * bgScale
      const bgH = targetHeight * bgScale
      ctx.drawImage(img, (targetWidth - bgW) / 2, (targetHeight - bgH) / 2, bgW, bgH)
      ctx.restore()

      // Add soft dark gradient overlay for studio portrait look
      if (vignette > 0) {
        ctx.save()
        const gradient = ctx.createRadialGradient(
          targetWidth / 2,
          targetHeight / 2,
          targetWidth * 0.25,
          targetWidth / 2,
          targetHeight / 2,
          targetWidth * 0.7
        )
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
        gradient.addColorStop(1, `rgba(0, 0, 0, ${vignette * 0.008})`)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, targetWidth, targetHeight)
        ctx.restore()
      }
    } else {
      // Clean white/subtle background
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, targetWidth, targetHeight)
    }

    // 2. Draw Main Image with Zoom, Pan, Rotation
    ctx.save()

    // Translate to canvas center
    ctx.translate(targetWidth / 2 + currentPan.x, targetHeight / 2 + currentPan.y)
    ctx.rotate((currentRotation * Math.PI) / 180)
    ctx.scale(currentZoom, currentZoom)

    // Calculate aspect ratio fit
    const imgAspect = img.naturalWidth / img.naturalHeight
    const targetAspect = targetWidth / targetHeight
    let renderW = targetWidth
    let renderH = targetHeight

    if (imgAspect > targetAspect) {
      renderW = targetHeight * imgAspect
      renderH = targetHeight
    } else {
      renderW = targetWidth
      renderH = targetWidth / imgAspect
    }

    // Draw main sharp product image
    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH)
    ctx.restore()

    // 3. Optional edge vignette if blur is active
    if (blur > 0) {
      ctx.save()
      const edgeVignette = ctx.createRadialGradient(
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.35,
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.75
      )
      edgeVignette.addColorStop(0, 'rgba(0,0,0,0)')
      edgeVignette.addColorStop(1, 'rgba(0,0,0,0.35)')
      ctx.fillStyle = edgeVignette
      ctx.fillRect(0, 0, targetWidth, targetHeight)
      ctx.restore()
    }
  }, [])

  // Load image onto image object
  useEffect(() => {
    if (!isOpen || !imageUrl) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => {
      imageObjRef.current = img
      setZoom(1)
      setRotation(0)
      setBlurIntensity(0)
      setVignetteDarkness(0)
      setPan({ x: 0, y: 0 })
      renderCanvas(img, 1, 0, 0, 0, { x: 0, y: 0 }, aspectRatio)
    }
  }, [isOpen, imageUrl, aspectRatio, renderCanvas])

  // Re-render canvas whenever controls change
  useEffect(() => {
    if (imageObjRef.current) {
      renderCanvas(imageObjRef.current, zoom, rotation, blurIntensity, vignetteDarkness, pan, aspectRatio)
    }
  }, [zoom, rotation, blurIntensity, vignetteDarkness, pan, aspectRatio, renderCanvas])

  // Mouse / Touch Dragging for Panning
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle Save: convert canvas to compressed WebP File
  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsProcessing(true)

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsProcessing(false)
          return
        }

        const rawFile = new File([blob], `edited-${Date.now()}.webp`, { type: 'image/webp' })
        const finalFile = await compressImageClientSide(rawFile)
        const finalUrl = URL.createObjectURL(finalFile)

        onSave(finalUrl, finalFile)
        setIsProcessing(false)
        onClose()
      }, 'image/webp', 0.88)
    } catch (err) {
      console.error('Error saving edited image:', err)
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[95vh] border border-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">محرر الصورة السريع</h3>
              <p className="text-[10px] text-gray-500">قص، تدوير، وضبط تعتيم الخلفية محلياً في جهازك</p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 bg-gray-950 p-4 flex items-center justify-center overflow-hidden relative">
          <div 
            className="relative cursor-move touch-none flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl overflow-hidden shadow-2xl"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <canvas 
              ref={canvasRef} 
              className="max-h-[50vh] sm:max-h-[55vh] max-w-full object-contain"
            />

            {/* Helper overlay hint */}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
              اسحب للتحريك
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 bg-white space-y-4 overflow-y-auto max-h-[35vh]">
          
          {/* 1. Quick Ratio & Rotation Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <span className="text-gray-400 text-[11px] ml-1">الأبعاد:</span>
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  aspectRatio === '1:1'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                مربع (1:1)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('4:5')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  aspectRatio === '4:5'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                طولي (4:5)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('free')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  aspectRatio === 'free'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                الأصلية
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                title="تدوير 90 درجة"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>تدوير</span>
              </button>
            </div>
          </div>

          {/* 2. Sliders: Zoom & Background Blur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Zoom Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-gray-500" /> التكبير والقص
                </span>
                <span className="text-gray-500 text-[11px] font-mono">{zoom.toFixed(1)}x</span>
              </div>
              <input 
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            {/* Background Blur Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> تعتيم وتشويش الخلفية
                </span>
                <span className="text-gray-500 text-[11px] font-mono">{blurIntensity}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                step="5"
                value={blurIntensity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  setBlurIntensity(val)
                  if (val > 0) setVignetteDarkness(Math.round(val * 0.4))
                  else setVignetteDarkness(0)
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تطبيق التعديل</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
