'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  X, 
  Check, 
  RotateCw, 
  ZoomIn, 
  Scissors, 
  Sparkles,
  Paintbrush,
  Undo2,
  Move
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

  // Editor modes: 'move' (pan & crop) or 'blurBrush' (smudge/blur old prices & text with finger)
  const [activeTool, setActiveTool] = useState<'move' | 'blurBrush'>('move')
  const [brushSize, setBrushSize] = useState<number>(36) // px on canvas
  const [history, setHistory] = useState<ImageData[]>([])

  // Editor states
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [blurIntensity, setBlurIntensity] = useState(0) // 0 to 100 for background
  const [vignetteDarkness, setVignetteDarkness] = useState(0) // 0 to 100
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | 'free'>('1:1')
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = useState(false)
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

    // Target canvas dimensions
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
      setActiveTool('move')
      setHistory([])
      renderCanvas(img, 1, 0, 0, 0, { x: 0, y: 0 }, aspectRatio)
    }
  }, [isOpen, imageUrl, aspectRatio, renderCanvas])

  // Re-render base canvas when transformations change
  useEffect(() => {
    if (imageObjRef.current) {
      renderCanvas(imageObjRef.current, zoom, rotation, blurIntensity, vignetteDarkness, pan, aspectRatio)
      setHistory([]) // Reset brush history when image orientation or zoom changes
    }
  }, [zoom, rotation, blurIntensity, vignetteDarkness, pan, aspectRatio, renderCanvas])

  // Get pointer coordinates mapped to the internal canvas resolution
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      rawClientX: clientX,
      rawClientY: clientY,
    }
  }

  // Apply localized mosaic / blur under the finger or cursor
  const applyBlurAtPoint = (cx: number, cy: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const radius = brushSize
    const diameter = radius * 2

    // Bound box within canvas
    const startX = Math.max(0, Math.floor(cx - radius))
    const startY = Math.max(0, Math.floor(cy - radius))
    const endX = Math.min(canvas.width, Math.ceil(cx + radius))
    const endY = Math.min(canvas.height, Math.ceil(cy + radius))
    const width = endX - startX
    const height = endY - startY

    if (width <= 0 || height <= 0) return

    // Create an offscreen helper to perform heavy blur + pixelate
    const off = document.createElement('canvas')
    off.width = width
    off.height = height
    const offCtx = off.getContext('2d')
    if (!offCtx) return

    // Draw source region to offscreen
    offCtx.drawImage(canvas, startX, startY, width, height, 0, 0, width, height)

    // Downscale then upscale with smooth filter to create heavy blur & smudge
    const mini = document.createElement('canvas')
    const sampleSize = 10 // small sample for pixel smudge
    mini.width = Math.max(2, Math.floor(width / sampleSize))
    mini.height = Math.max(2, Math.floor(height / sampleSize))
    const miniCtx = mini.getContext('2d')
    if (!miniCtx) return

    miniCtx.imageSmoothingEnabled = true
    miniCtx.drawImage(off, 0, 0, mini.width, mini.height)

    // Stretch back onto offCtx with high blur
    offCtx.clearRect(0, 0, width, height)
    offCtx.filter = 'blur(6px)'
    offCtx.drawImage(mini, 0, 0, width, height)

    // Mask with a soft circular gradient so brush edges blend seamlessly
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(off, startX, startY)
    ctx.restore()
  }

  // Save current canvas snapshot for Undo
  const saveSnapshot = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory((prev) => [...prev.slice(-9), snapshot]) // keep last 10 steps
  }

  // Undo last stroke
  const handleUndo = () => {
    if (history.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const previousHistory = [...history]
    const lastSnapshot = previousHistory.pop()
    setHistory(previousHistory)

    if (lastSnapshot) {
      ctx.putImageData(lastSnapshot, 0, 0)
    }
  }

  // Pointer & Touch handlers
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length > 1) return // ignore multi-touch
    setIsInteracting(true)
    const coords = getCanvasCoordinates(e)
    if (!coords) return

    if (activeTool === 'move') {
      setDragStart({ x: coords.rawClientX - pan.x, y: coords.rawClientY - pan.y })
    } else if (activeTool === 'blurBrush') {
      saveSnapshot()
      applyBlurAtPoint(coords.x, coords.y)
    }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isInteracting) return
    const coords = getCanvasCoordinates(e)
    if (!coords) return

    if (activeTool === 'move') {
      setPan({
        x: coords.rawClientX - dragStart.x,
        y: coords.rawClientY - dragStart.y,
      })
    } else if (activeTool === 'blurBrush') {
      applyBlurAtPoint(coords.x, coords.y)
    }
  }

  const handlePointerUp = () => {
    setIsInteracting(false)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-sm select-none"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[96vh] border border-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">محرر الصورة وطمس الأسعار</h3>
              <p className="text-[10px] text-gray-500">قص وتدوير ومسح الأسعار القديمة بإصبعك محلياً</p>
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

        {/* Mode Switcher: Pan/Crop vs Blur Brush */}
        <div className="px-4 py-2 bg-gray-100/80 border-b border-gray-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTool('move')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTool === 'move'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>تحريك وقص</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('blurBrush')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTool === 'blurBrush'
                  ? 'bg-amber-500 text-gray-950 shadow-sm ring-2 ring-amber-300'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>طمس وتشويش بالإصبع</span>
            </button>
          </div>

          {activeTool === 'blurBrush' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                title="تراجع عن آخر طمس"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>تراجع</span>
              </button>
            </div>
          )}
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 bg-gray-950 p-3 sm:p-4 flex items-center justify-center overflow-hidden relative">
          <div 
            className={`relative touch-none flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl overflow-hidden shadow-2xl ${
              activeTool === 'blurBrush' ? 'cursor-crosshair' : 'cursor-move'
            }`}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            <canvas 
              ref={canvasRef} 
              className="max-h-[46vh] sm:max-h-[52vh] max-w-full object-contain"
            />

            {/* Helper Hint */}
            <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full pointer-events-none flex items-center gap-1">
              {activeTool === 'blurBrush' ? (
                <>
                  <Paintbrush className="w-3 h-3 text-amber-400" />
                  <span>المس أو اسحب فوق السعر أو النص لطمسه</span>
                </>
              ) : (
                <>
                  <Move className="w-3 h-3 text-gray-300" />
                  <span>اسحب بإصبعك لتحريك موضع الصورة</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-3 sm:p-4 bg-white space-y-3 overflow-y-auto max-h-[36vh]">
          
          {/* Conditional Control depending on Active Tool */}
          {activeTool === 'blurBrush' ? (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span className="flex items-center gap-1">
                  <Paintbrush className="w-3.5 h-3.5 text-amber-600" /> حجم فرشاة التشويش
                </span>
                <span className="text-gray-600 font-mono text-[11px]">{brushSize}px</span>
              </div>
              <input 
                type="range"
                min="15"
                max="80"
                step="5"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-amber-800 font-medium">
                مرّر إصبعك فوق الأسعار القديمة، الأرقام أو الشعارات على الصورة لإخفائها فوراً بطمس ناعم.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Quick Ratio & Rotation Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <span className="text-gray-400 text-[11px] ml-1">الأبعاد:</span>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('1:1')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
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
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
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
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Zoom Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5 text-gray-500" /> التكبير
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
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> تعتيم خلفية الصورة
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
            </>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
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
