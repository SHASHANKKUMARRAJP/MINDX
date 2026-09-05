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

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const onDrop = useCallback(accepted => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setHoveredIdx(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false, accept: { 'image/*': [] }
  })

  const startCamera = async () => {
    setCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setError('Camera access denied')
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
      className="relative z-10 max-w-7xl mx-auto px-6 py-8"
    >
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-cyan-500/30 bg-cyan-500/10">◎</div>
          <div>
            <h1 className="font-outfit font-800 text-3xl text-gradient-cyan" style={{fontWeight:800}}>Reality Scanner</h1>
            <p className="text-white/45 text-sm font-inter">Cloud Vision Intelligence · Object Bounding Boxes · Micro-Feature & Label Extraction</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Upload & Bounding Box Canvas (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {!cameraOpen && (
            <div className="flex gap-2">
              <button onClick={startCamera} className="btn-ghost flex items-center gap-2 text-sm">
                <span>📷</span> Use Camera
              </button>
              <span className="text-white/20 self-center text-sm">or drag image below</span>
            </div>
          )}

          {/* Camera Feed */}
          <AnimatePresence>
            {cameraOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-t-2xl max-h-72 object-cover"
                />
                <div className="flex gap-2 p-3">
                  <button onClick={capturePhoto} className="btn-nexus flex-1 py-2.5 text-sm">📸 Capture</button>
                  <button onClick={stopCamera} className="btn-ghost px-4 text-sm">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Drop Zone & Image with Bounding Box Overlays */}
          {!cameraOpen && (
            <div
              {...getRootProps()}
              className={`drop-zone rounded-2xl overflow-hidden transition-all relative border border-white/10 ${isDragActive ? 'active' : ''}`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="relative group bg-black/80 min-h-[260px] p-2 text-center flex items-center justify-center">
                  <div className="relative inline-block overflow-hidden rounded-xl max-w-full">
                    <img src={preview} alt="Preview" className="block max-h-[440px] w-auto h-auto max-w-full mx-auto rounded-xl" />

                    {/* Bounding Boxes — Neon Green overlay (Google Cloud Vision style) */}
                    {result?.objects?.map((obj, i) => {
                      if (!obj.bounding_box) return null
                      const [ymin, xmin, ymax, xmax] = obj.bounding_box
                      const isHovered = hoveredIdx === i
                      const h = Math.max(ymax - ymin, 2)
                      const w = Math.max(xmax - xmin, 2)
                      return (
                        <div
                          key={i}
                          className={`absolute border-2 transition-all rounded pointer-events-none ${
                            isHovered
                              ? 'border-emerald-400 bg-emerald-500/25 shadow-lg shadow-emerald-500/60 z-30 scale-[1.01]'
                              : 'border-emerald-500/70 bg-emerald-500/10 z-20'
                          }`}
                          style={{
                            top: `${ymin}%`,
                            left: `${xmin}%`,
                            height: `${h}%`,
                            width: `${w}%`,
                          }}
                        >
                          <span className="absolute -top-5 left-0 bg-emerald-950/90 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/40 whitespace-nowrap font-mono font-semibold shadow z-40">
                            {obj.name} ({obj.score || 90}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none">
                    <span className="text-white font-outfit text-sm bg-black/70 px-4 py-2 rounded-xl border border-white/20">Click or drop to replace image</span>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-3 opacity-20">◎</div>
                  <p className="text-white/50 font-outfit text-base">Drop an image here to analyze</p>
                  <p className="text-white/30 text-xs mt-1">Detects objects, nose ring, earrings, bindi, clothing, car parts, labels & micro features</p>
                </div>
              )}
            </div>
          )}

          {/* Question / Prompt Input */}
          <div>
            <label className="text-xs font-outfit text-white/40 uppercase tracking-widest block mb-1">Optional Focus Prompt</label>
            <input
              className="nexus-input text-sm"
              placeholder={`e.g. "Identify nose ring, earrings, bindi & jewelry in detail"`}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>

          {/* Scan Action Button */}
          <button
            onClick={handleScan}
            disabled={!file || loading}
            className="btn-nexus w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="flex gap-1"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>
                <span>Scanning with MINDX Vision Engine...</span>
              </>
            ) : (
              <><span>◎</span><span>Run Reality Scan</span></>
            )}
          </button>

          {error && (
            <div className="glass rounded-xl p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Right Column: Google Cloud Vision Style Tabbed Inspector (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="glass rounded-2xl overflow-hidden border border-white/10 min-h-[480px]">
            {/* Top Navigation Tabs (Objects, Labels, Properties, Safe Search) */}
            <div className="flex border-b border-white/10 bg-white/[0.02] overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3.5 text-sm font-outfit font-500 transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 font-semibold'
                      : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'objects' && result?.objects?.length ? (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">{result.objects.length}</span>
                  ) : null}
                  {tab.id === 'labels' && result?.labels?.length ? (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">{result.labels.length}</span>
                  ) : null}
                  {tab.id === 'features' && result?.micro_features?.length ? (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">{result.micro_features.length}</span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Tab Contents Panel */}
            <div className="p-6">
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
                      <div className="grid grid-cols-3 gap-3">
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
                      <p className="text-xs font-outfit text-white/40 uppercase tracking-widest mb-2">Content Moderation & Safety Metrics</p>
                      <div className="grid grid-cols-2 gap-3">
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
