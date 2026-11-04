import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { realityScan } from '../services/api'

const TABS = [
  { id: 'objects', label: 'Objects' },
  { id: 'labels', label: 'Labels' },
  { id: 'features', label: 'Micro Features' },
  { id: 'properties', label: 'Properties' },
  { id: 'safesearch', label: 'Safe Search' },
  { id: 'explanation', label: 'Explanation & OCR' },
]

export default function Reality() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('objects')
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [imageDimensions, setImageDimensions] = useState(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const nativeCameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const previewContainerRef = useRef(null)
  const resultsContainerRef = useRef(null)

  const onDrop = useCallback(accepted => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setImageDimensions(null)
    setResult(null)
    setHoveredIdx(null)
  }, [])

  const handleNativeCamera = e => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setImageDimensions(null)
    setResult(null)
    setHoveredIdx(null)
  }

  const handleGalleryUpload = e => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setImageDimensions(null)
    setResult(null)
    setHoveredIdx(null)
  }

  // Instant demo sample image generator for zero-friction mobile testing
  const loadSampleImage = (type = 'portrait') => {
    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 540
    const ctx = canvas.getContext('2d')
    if (type === 'portrait') {
      const grad = ctx.createLinearGradient(0, 0, 720, 540)
      grad.addColorStop(0, '#0c1a2f')
      grad.addColorStop(0.6, '#182d4d')
      grad.addColorStop(1, '#081220')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 720, 540)
      // Silhouette / Portrait Face
      ctx.fillStyle = '#fce7f3'
      ctx.beginPath()
      ctx.ellipse(360, 240, 110, 140, 0, 0, Math.PI * 2)
      ctx.fill()
      // Bindi
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(360, 195, 7, 0, Math.PI * 2)
      ctx.fill()
      // Nose Ring / Stud
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(375, 250, 5, 0, Math.PI * 2)
      ctx.fill()
      // Gold Earring
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.arc(245, 260, 14, 0, Math.PI * 2)
      ctx.fill()
      // Text
      ctx.font = 'bold 20px Outfit, sans-serif'
      ctx.fillStyle = '#38bdf8'
      ctx.textAlign = 'center'
      ctx.fillText('Sample Portrait with Jewelry & Micro-Features', 360, 470)
    } else {
      const grad = ctx.createLinearGradient(0, 0, 720, 540)
      grad.addColorStop(0, '#090d16')
      grad.addColorStop(1, '#1e293b')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 720, 540)
      // Vehicle Body
      ctx.fillStyle = '#06b6d4'
      ctx.roundRect ? ctx.roundRect(160, 260, 400, 120, 24) : ctx.fillRect(160, 260, 400, 120)
      ctx.fill()
      // Wheels
      ctx.fillStyle = '#334155'
      ctx.beginPath()
      ctx.arc(240, 390, 35, 0, Math.PI * 2)
      ctx.arc(480, 390, 35, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = 'bold 20px Outfit, sans-serif'
      ctx.fillStyle = '#a855f7'
      ctx.textAlign = 'center'
      ctx.fillText('Sample Vehicle & Urban Scene', 360, 180)
    }

    canvas.toBlob(blob => {
      const f = new File([blob], `${type}-sample.jpg`, { type: 'image/jpeg' })
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setImageDimensions(null)
      setResult(null)
      setHoveredIdx(null)
      if (type === 'portrait') {
        setPrompt('Detect face, nose ring, earring, bindi, jewelry and micro features in detail.')
      } else {
        setPrompt('Detect vehicle, wheels, body parts, and urban context.')
      }
    }, 'image/jpeg', 0.92)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false, accept: { 'image/*': [] }
  })

  const startCamera = async () => {
    setCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setError('Live camera stream not supported or denied. Please use "Take Photo" or upload an image.')
      setCameraOpen(false)
    }
  }

  const capturePhoto = () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      const f = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setImageDimensions(null)
      stopCamera()
      setResult(null)
      setHoveredIdx(null)
    }, 'image/jpeg', 0.92)
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOpen(false)
  }

  const handleScan = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setHoveredIdx(null)
    try {
      const data = await realityScan(
        file,
        prompt || 'Detect all objects, nose ring, earring, bindi, clothing, car, wheels, and micro features in detail.'
      )
      setResult(data)
      setTimeout(() => {
        resultsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Scan failed. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full max-w-full overflow-x-clip"
    >
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-cyan-500/30 bg-cyan-500/10 flex-shrink-0">◎</div>
          <div>
            <h1 className="font-outfit font-800 text-2xl sm:text-3xl text-gradient-cyan" style={{fontWeight:800}}>Reality Scanner</h1>
            <p className="text-white/45 text-xs sm:text-sm font-inter">Cloud Vision Intelligence · Object Bounding Boxes · Micro-Feature &amp; Label Extraction</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start w-full min-w-0 max-w-full">
        {/* Left Column: Image Upload & Bounding Box Canvas (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 w-full min-w-0 max-w-full">
          {/* Hidden file inputs for Camera and Photo Gallery */}
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleNativeCamera}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryUpload}
          />

          {/* Camera Feed */}
          <AnimatePresence>
            {cameraOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-2xl overflow-hidden border border-cyan-500/30 w-full min-w-0 max-w-full"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-t-2xl max-h-72 object-cover block"
                />
                <div className="flex gap-2 p-3 bg-black/60 backdrop-blur-md">
                  <button onClick={capturePhoto} className="btn-nexus flex-1 py-3 text-sm font-semibold">📸 Capture Photo</button>
                  <button onClick={stopCamera} className="btn-ghost px-4 text-sm">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Viewfinder Studio Card */}
          {!cameraOpen && (
            <div className="glass rounded-2xl p-3 sm:p-4 border border-white/10 space-y-3 w-full min-w-0 max-w-full overflow-hidden">
              {/* Top Quick Actions Bar */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="btn-nexus py-3 px-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 font-semibold"
                >
                  <span className="text-base">📸</span>
                  <span>Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="btn-ghost py-3 px-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 font-semibold border border-white/15 hover:border-cyan-400/50"
                >
                  <span className="text-base">🖼️</span>
                  <span>Photo Library</span>
                </button>
              </div>

              {/* Viewfinder / Image Canvas */}
              <div
                ref={previewContainerRef}
                {...getRootProps()}
                className={`drop-zone rounded-xl overflow-hidden transition-all relative border border-dashed w-full min-w-0 max-w-full ${
                  isDragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/15 bg-black/40'
                }`}
              >
                <input {...getInputProps()} />

                {preview ? (
                  <div className="relative group bg-black/90 p-1.5 sm:p-2 text-center flex items-center justify-center w-full min-w-0 max-w-full overflow-hidden rounded-xl min-h-[220px] max-h-[52vh] sm:max-h-[460px]">
                    {/* Constrained Image Frame tightly locking aspect ratio & boundaries */}
                    <div
                      className="relative max-w-full max-h-[52vh] sm:max-h-[460px] flex items-center justify-center overflow-hidden rounded-lg mx-auto"
                      style={{
                        aspectRatio: imageDimensions ? `${imageDimensions.naturalWidth} / ${imageDimensions.naturalHeight}` : 'auto',
                      }}
                    >
                      <img
                        src={preview}
                        alt="Uploaded Preview"
                        onLoad={(e) => {
                          setImageDimensions({
                            naturalWidth: e.currentTarget.naturalWidth,
                            naturalHeight: e.currentTarget.naturalHeight
                          })
                        }}
                        className="w-full h-full max-w-full max-h-[52vh] sm:max-h-[460px] object-contain rounded-lg block select-none pointer-events-none"
                      />

                      {/* Laser Scanning Animation Line */}
                      {loading && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-30">
                          <motion.div
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00d4ff]"
                          />
                        </div>
                      )}

                      {/* Bounding Boxes — Neon Green overlay (Google Cloud Vision style) */}
                      {result?.objects?.map((obj, i) => {
                        if (!obj.bounding_box) return null
                        const [ymin, xmin, ymax, xmax] = obj.bounding_box
                        const isHovered = hoveredIdx === i
                        const h = Math.max(ymax - ymin, 2)
                        const w = Math.max(xmax - xmin, 2)
                        const isNearRight = xmin > 65
                        const isNearTop = ymin < 12

                        return (
                          <div
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation()
                              setHoveredIdx(hoveredIdx === i ? null : i)
                              setActiveTab('objects')
                            }}
                            className={`absolute border-2 transition-all rounded cursor-pointer pointer-events-auto ${
                              isHovered
                                ? 'border-emerald-400 bg-emerald-500/30 shadow-lg shadow-emerald-500/70 z-30 scale-[1.01]'
                                : 'border-emerald-500/70 bg-emerald-500/10 z-20 hover:border-emerald-400'
                            }`}
                            style={{
                              top: `${ymin}%`,
                              left: `${xmin}%`,
                              height: `${h}%`,
                              width: `${w}%`,
                            }}
                          >
                            <span
                              className={`absolute bg-emerald-950/95 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono font-semibold shadow z-40 max-w-[130px] sm:max-w-none truncate ${
                                isNearTop ? 'top-1' : '-top-5'
                              } ${
                                isNearRight ? 'right-0' : 'left-0'
                              }`}
                            >
                              {obj.name} ({obj.score || 90}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Change photo floating overlay */}
                    <div className="absolute top-2.5 right-2.5 z-40">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          galleryInputRef.current?.click()
                        }}
                        className="bg-black/75 hover:bg-black/90 text-white/90 text-[11px] font-outfit px-2.5 py-1 rounded-full border border-white/20 hover:border-cyan-400 shadow-lg flex items-center gap-1 backdrop-blur-md transition-all active:scale-95"
                      >
                        <span>↺</span> Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 sm:py-12 px-4 text-center cursor-pointer">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl">
                      ◎
                    </div>
                    <p className="text-white/80 font-outfit text-sm sm:text-base font-medium">Tap to select or drop an image</p>
                    <p className="text-white/40 text-xs mt-1 max-w-xs mx-auto">Detects objects, jewelry, clothing, vehicles, micro-features &amp; OCR text</p>
                  </div>
                )}
              </div>

              {/* Instant 1-Tap Sample Presets & AR Stream Toggle */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                <span className="text-white/40 text-[11px]">Quick Samples:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => loadSampleImage('portrait')}
                    className="tag text-[10px] sm:text-xs py-1 px-2 text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                  >
                    ⚡ Portrait &amp; Jewelry
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleImage('vehicle')}
                    className="tag text-[10px] sm:text-xs py-1 px-2 text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  >
                    ⚡ Vehicle &amp; Urban
                  </button>
                </div>
              </div>

              {/* Live WebRTC Camera Stream Toggle */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="text-white/40 hover:text-white/80 text-[11px] inline-flex items-center gap-1 transition-colors"
                >
                  <span>🎥</span> Or open in-browser Live Camera stream
                </button>
              </div>
            </div>
          )}

          {/* Question / Prompt Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-outfit text-white/50 uppercase tracking-wider block">Optional Focus Prompt</label>
              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="text-[10px] text-white/40 hover:text-white/70"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              className="nexus-input text-sm"
              placeholder={`e.g. "Identify nose ring, earrings, bindi & jewelry in detail"`}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            {/* Quick Prompt Filter Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {['Nose ring & Jewelry', 'Vehicles & Wheels', 'Text & OCR', 'Clothing & Style'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPrompt(`Detect ${tag.toLowerCase()} in high detail.`)}
                  className="text-[10px] text-white/40 hover:text-cyan-300 bg-white/[0.03] hover:bg-white/[0.08] px-2 py-0.5 rounded-md border border-white/5 transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Scan Action Button */}
          <button
            onClick={handleScan}
            disabled={!file || loading}
            className={`btn-nexus w-full py-3.5 sm:py-4 flex items-center justify-center gap-2 font-semibold text-sm sm:text-base ${
              !file ? 'opacity-50 cursor-not-allowed bg-white/10' : 'glow-cyan'
            }`}
          >
            {loading ? (
              <>
                <div className="flex gap-1"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>
                <span>Scanning with MINDX Vision Engine...</span>
              </>
            ) : !file ? (
              <><span>📸</span><span>Select or Take Photo to Scan</span></>
            ) : (
              <><span>✦</span><span>Run Reality Scan</span></>
            )}
          </button>

          {error && (
            <div className="glass rounded-xl p-3.5 border border-red-500/30 bg-red-500/10 text-red-400 text-xs sm:text-sm">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Right Column: Google Cloud Vision Style Tabbed Inspector (7 Cols) */}
        {/* On Mobile: Hidden when no image is scanned to prevent giant empty box; Visible when results exist or loading */}
        <div ref={resultsContainerRef} className={`lg:col-span-7 w-full min-w-0 max-w-full overflow-hidden ${!result && !loading ? 'hidden lg:block' : 'block'}`}>
          <div className="glass rounded-2xl overflow-hidden border border-white/10 min-h-[380px] sm:min-h-[480px]">
            {/* Top Navigation Tabs (Objects, Labels, Properties, Safe Search) */}
            <div className="flex border-b border-white/10 bg-white/[0.02] overflow-x-auto scrollbar-none px-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-outfit font-500 transition-all border-b-2 whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 font-semibold'
                      : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'objects' && result?.objects?.length ? (
                    <span className="ml-1.5 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">{result.objects.length}</span>
                  ) : null}
                  {tab.id === 'labels' && result?.labels?.length ? (
                    <span className="ml-1.5 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">{result.labels.length}</span>
                  ) : null}
                  {tab.id === 'features' && result?.micro_features?.length ? (
                    <span className="ml-1.5 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">{result.micro_features.length}</span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Tab Contents Panel */}
            <div className="p-4 sm:p-6">
              {loading && (
                <div className="space-y-4 py-8">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between">
                        <div className="h-4 w-28 skeleton rounded" />
                        <div className="h-4 w-12 skeleton rounded" />
                      </div>
                      <div className="h-2 w-full skeleton rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {!result && !loading && (
                <div className="py-20 text-center text-white/30 font-outfit">
                  <div className="text-5xl mb-3 opacity-20">◎</div>
                  <p className="text-lg">Upload an image and click "Run Reality Scan"</p>
                  <p className="text-xs text-white/20 mt-1">Detected items will appear with confidence scores & bounding boxes</p>
                </div>
              )}

              {result && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* TAB 1: OBJECTS (Cloud Vision Confidence Bar Style) */}
                  {activeTab === 'objects' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-outfit text-white/40 uppercase tracking-widest pb-2 border-b border-white/5">
                        <span>Detected Object / Item</span>
                        <span>Confidence Score</span>
                      </div>
                      <div className="space-y-4">
                        {result.objects?.map((obj, i) => {
                          const score = obj.score || 90
                          return (
                            <div
                              key={i}
                              onClick={() => {
                                setHoveredIdx(hoveredIdx === i ? null : i)
                                if (window.innerWidth < 1024) {
                                  previewContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }
                              }}
                              onMouseEnter={() => setHoveredIdx(i)}
                              onMouseLeave={() => setHoveredIdx(null)}
                              className={`p-3 rounded-xl transition-all cursor-pointer border ${
                                hoveredIdx === i
                                  ? 'bg-emerald-500/10 border-emerald-500/30'
                                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1.5 font-outfit text-sm">
                                <span className="font-medium text-white/90 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  {obj.name}
                                  {obj.location && <span className="text-[11px] text-white/40 font-mono">({obj.location})</span>}
                                </span>
                                <span className="font-mono font-semibold text-emerald-400">{score}%</span>
                              </div>

                              {/* Confidence Progress Bar */}
                              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-1">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${score}%` }}
                                  transition={{ duration: 0.5, delay: i * 0.05 }}
                                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                                />
                              </div>
                              {obj.description && (
                                <p className="text-white/50 text-xs font-inter leading-relaxed mt-1">{obj.description}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LABELS */}
                  {activeTab === 'labels' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-outfit text-white/40 uppercase tracking-widest pb-2 border-b border-white/5">
                        <span>Label Category</span>
                        <span>Confidence</span>
                      </div>
                      <div className="space-y-3">
                        {result.labels?.map((lbl, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                            <div className="flex justify-between items-center font-outfit text-sm">
                              <span className="text-white/90 font-medium">{lbl.name}</span>
                              <span className="font-mono font-semibold text-cyan-400">{lbl.score}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${lbl.score}%` }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MICRO FEATURES (Nose Ring, Earring, Bindi, Jewelry) */}
                  {activeTab === 'features' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-outfit text-white/40 uppercase tracking-widest pb-2 border-b border-white/5">
                        <span>Micro Feature / Accessory</span>
                        <span>Detection Score</span>
                      </div>
                      <div className="space-y-3">
                        {result.micro_features?.map((feat, i) => (
                          <div key={i} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1.5">
                            <div className="flex justify-between items-center font-outfit text-sm">
                              <span className="text-purple-200 font-semibold flex items-center gap-2">
                                <span>✨</span> {feat.name}
                              </span>
                              <span className="font-mono font-semibold text-purple-300">{feat.score}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${feat.score}%` }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PROPERTIES & DOMINANT COLORS */}
                  {activeTab === 'properties' && (
                    <div className="space-y-5">
                      {/* Image Metadata Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                        <div className="glass p-3 rounded-xl text-center">
                          <div className="text-xs text-white/40 font-outfit uppercase">Scene Type</div>
                          <div className="text-sm font-semibold text-cyan-300 mt-1">{result.detected_scene_type || 'General'}</div>
                        </div>
                        <div className="glass p-3 rounded-xl text-center">
                          <div className="text-xs text-white/40 font-outfit uppercase">Spatial Depth</div>
                          <div className="text-sm font-semibold text-purple-300 mt-1">{result.spatial_depth || 'Standard'}</div>
                        </div>
                        <div className="glass p-3 rounded-xl text-center">
                          <div className="text-xs text-white/40 font-outfit uppercase">Lighting</div>
                          <div className="text-sm font-semibold text-amber-300 mt-1">{result.lighting_condition || 'Ambient'}</div>
                        </div>
                      </div>

                      {/* Dominant Color Palette */}
                      {result.dominant_colors?.length > 0 && (
                        <div>
                          <p className="text-xs font-outfit text-white/40 uppercase tracking-widest mb-3">Dominant Color Palette</p>
                          <div className="space-y-2">
                            {result.dominant_colors.map((c, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
                                <div
                                  className="w-8 h-8 rounded-lg border border-white/20 shadow flex-shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs font-outfit">
                                    <span className="text-white/90 font-medium">{c.name}</span>
                                    <span className="font-mono text-white/60">{c.hex} ({c.percentage}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, backgroundColor: c.hex }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: SAFE SEARCH */}
                  {activeTab === 'safesearch' && (
                    <div className="space-y-4">
                      <p className="text-xs font-outfit text-white/40 uppercase tracking-widest mb-2">Content Moderation &amp; Safety Metrics</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        {Object.entries(result.safe_search || { adult: 'Very Unlikely', spoof: 'Very Unlikely', medical: 'Very Unlikely', violence: 'Very Unlikely', racy: 'Very Unlikely' }).map(([key, val]) => (
                          <div key={key} className="glass p-3.5 rounded-xl flex items-center justify-between">
                            <span className="text-sm font-outfit capitalize text-white/80">{key}</span>
                            <span className="tag tag-green text-xs font-mono">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: EXPLANATION & OCR */}
                  {activeTab === 'explanation' && (
                    <div className="space-y-4">
                      <div className="glass p-4 rounded-xl space-y-2 border-l-4 border-cyan-500">
                        <p className="text-xs font-outfit text-white/40 uppercase tracking-widest">Executive Assessment</p>
                        <p className="text-white/90 text-sm font-inter leading-relaxed">{result.overall_assessment}</p>
                      </div>

                      <div className="glass p-4 rounded-xl space-y-2">
                        <p className="text-xs font-outfit text-white/40 uppercase tracking-widest">Detailed Scene Explanation</p>
                        <p className="text-white/70 text-sm font-inter leading-relaxed whitespace-pre-line">{result.explanation}</p>
                      </div>

                      {result.extracted_text && (
                        <div className="glass p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                          <p className="text-xs font-outfit text-emerald-400 uppercase tracking-widest mb-2">Extracted Text (OCR)</p>
                          <p className="font-mono text-xs text-emerald-200 bg-black/40 p-3 rounded-lg leading-relaxed whitespace-pre-line border border-emerald-500/20">
                            {result.extracted_text}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
