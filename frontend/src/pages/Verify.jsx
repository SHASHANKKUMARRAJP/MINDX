import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { verifyContent } from '../services/api'

const STATUS_STYLE = {
  clean:      { tag: 'tag-green', icon: '✓', label: 'Clean' },
  warning:    { tag: 'tag-orange', icon: '⚠', label: 'Warning' },
  suspicious: { tag: 'tag-red', icon: '⛔', label: 'Suspicious' },
}

const verdictStyle = (v = '') => {
  if (v.toLowerCase().includes('no anomal')) return { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' }
  if (v.toLowerCase().includes('possible')) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' }
  return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' }
}

export default function Verify() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [textContent, setTextContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback(accepted => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f))
    else setPreview(null)
    setResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false, accept: { 'image/*': [], 'text/*': [] }
  })

  const handleVerify = async () => {
    if (!file && !textContent.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await verifyContent(file, textContent)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const ScoreBar = ({ label, score }) => (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-outfit text-white/50">{label}</span>
        <span className="text-xs font-mono text-white/70">{(score * 100).toFixed(0)}%</span>
      </div>
      <div className="confidence-bar">
        <motion.div
          className="confidence-fill"
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 max-w-6xl mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-green-500/30 bg-green-500/10">◉</div>
          <div>
            <h1 className="font-outfit font-800 text-3xl text-gradient-cyan" style={{fontWeight:800}}>Content Verify</h1>
            <p className="text-white/45 text-sm font-inter">AI-Assisted Content Analysis · Not a definitive judgment tool</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-start gap-3 mt-4">
          <span className="text-yellow-400 text-lg">⚠</span>
          <p className="text-yellow-400/80 text-sm font-inter leading-relaxed">
            <strong className="font-outfit">Important disclaimer:</strong> This tool performs AI-assisted analysis only.
            Results cannot definitively determine whether content is authentic, manipulated, or synthetic.
            Always consult qualified professionals for critical decisions.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left — Input */}
        <div className="space-y-4">
          {/* Drop zone */}
          <div {...getRootProps()} className={`drop-zone rounded-2xl overflow-hidden ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="To verify" className="w-full object-cover max-h-64 rounded-2xl" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                  <span className="text-white font-outfit">Click to replace</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-5xl mb-3 opacity-20">◉</div>
                <p className="text-white/40 font-outfit">
                  {isDragActive ? 'Drop content here →' : 'Drop an image or file to analyze'}
                </p>
                <p className="text-white/25 text-sm mt-1">Images supported for full analysis</p>
              </div>
            )}
          </div>

          {file && (
            <div className="flex items-center gap-2 glass rounded-xl px-4 py-3">
              <span className="text-lg">{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
              <span className="text-white/70 text-sm font-outfit flex-1 truncate">{file.name}</span>
              <button onClick={() => { setFile(null); setPreview(null) }} className="text-white/30 hover:text-white/60 text-lg">×</button>
            </div>
          )}

          {/* Optional text */}
          <div>
            <label className="text-xs font-outfit text-white/35 uppercase tracking-widest block mb-2">
              Additional context or text to analyze (optional)
            </label>
            <textarea
              className="nexus-input resize-none"
              rows={4}
              placeholder="Paste text content, captions, or additional context for analysis..."
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={(!file && !textContent.trim()) || loading}
            className="btn-nexus w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><div className="flex gap-1"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div><span>Analyzing content…</span></>
            ) : (
              <><span>◉</span><span>Run AI Analysis</span></>
            )}
          </button>

          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                <p className="text-red-400 text-sm font-outfit">⚠ {error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — Results */}
        <div>
          {loading && (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
          )}

          <AnimatePresence>
            {result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Header badge */}
                <div className="glass rounded-xl p-5 text-center">
                  <p className="text-xs font-outfit text-white/35 uppercase tracking-widest mb-3">AI-Assisted Analysis Result</p>
                  <div
                    className="rounded-xl p-4 mb-3"
                    style={{
                      background: verdictStyle(result.verdict).bg,
                      border: `1px solid ${verdictStyle(result.verdict).border}`,
                    }}
                  >
                    <p className="font-outfit font-700 text-lg" style={{ color: verdictStyle(result.verdict).color, fontWeight: 700 }}>
                      {result.verdict}
                    </p>
                  </div>
                </div>

                {/* Score bars */}
                <div className="glass rounded-xl p-5">
                  <p className="text-xs font-outfit text-white/35 uppercase tracking-widest mb-4">Consistency Scores</p>
                  <ScoreBar label="Visual Consistency" score={result.consistency_score ?? 0} />
                  <ScoreBar label="Context Consistency" score={result.context_score ?? 0} />
                </div>

                {/* Indicators */}
                <div className="glass rounded-xl p-5">
                  <p className="text-xs font-outfit text-white/35 uppercase tracking-widest mb-4">Analysis Indicators</p>
                  <div className="space-y-3">
                    {result.indicators?.map((ind, i) => {
                      const style = STATUS_STYLE[ind.status] || STATUS_STYLE.warning
                      return (
                        <div key={i} className="flex items-start gap-3 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                          <span className={`tag ${style.tag} flex-shrink-0 mt-0.5`}>{style.icon}</span>
                          <div>
                            <p className="text-white/80 text-sm font-outfit mb-0.5">{ind.label}</p>
                            <p className="text-white/45 text-xs font-inter leading-relaxed">{ind.detail}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="glass rounded-xl p-5">
                  <p className="text-xs font-outfit text-white/35 uppercase tracking-widest mb-3">Analysis Summary</p>
                  <p className="text-white/65 text-sm leading-relaxed font-inter">{result.summary}</p>
                </div>

                {/* Disclaimer */}
                <div className="glass rounded-xl p-4 border border-yellow-500/15 bg-yellow-500/5">
                  <p className="text-yellow-400/70 text-xs font-inter leading-relaxed">{result.disclaimer}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !loading && (
            <div className="glass rounded-2xl p-10 text-center h-64 flex items-center justify-center">
              <div>
                <div className="text-5xl mb-3 opacity-15">◉</div>
                <p className="text-white/30 font-outfit">Upload content to begin AI analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
