import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { extractKnowledge, analyzeGithubRepo, askGithubRepo } from '../services/api'
import KnowledgeGraph from '../components/KnowledgeGraph'

const GITHUB_EXAMPLES = [
  "fastapi/fastapi",
  "pallets/flask",
  "facebook/react",
  "octocat/Hello-World",
]

export default function Brain() {
  const location = useLocation()
  const [inputMode, setInputMode] = useState('files') // 'files' | 'github'
  const [files, setFiles] = useState([])
  const [githubUrl, setGithubUrl] = useState('')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [githubAnalysis, setGithubAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('graph') // 'graph' | 'overview' | 'gaps' | 'actions'

  // Q&A state for repository / project analysis
  const [chatMsgs, setChatMsgs] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs])

  // Auto-load files or repo passed from location state
  useEffect(() => {
    if (location.state?.repoFiles?.length > 0) {
      const convertedFiles = location.state.repoFiles.map(f => {
        const blob = new Blob([f.content || ''], { type: 'text/plain' })
        return new File([blob], f.filename || 'file.txt', { type: 'text/plain' })
      })
      setFiles(convertedFiles)
      if (location.state?.repoName) {
        setQuestion(`Knowledge graph analysis for repository: ${location.state.repoName}`)
      }
      triggerExtraction(convertedFiles, `Knowledge graph for repository ${location.state.repoName || ''}`)
    } else if (location.state?.mode === 'github') {
      setInputMode('github')
      if (location.state?.url) {
        setGithubUrl(location.state.url)
        triggerGithubRepoAnalysis(location.state.url)
      }
    }
  }, [location.state])

  const onDrop = useCallback(accepted => {
    setFiles(prev => {
      const existing = prev.map(f => f.name)
      const newFiles = accepted.filter(f => !existing.includes(f.name))
      return [...prev, ...newFiles]
    })
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'text/*': [],
      'application/pdf': [],
      'image/*': [],
      'application/json': [],
    }
  })

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name))

  const triggerExtraction = async (filesToProcess, customQ = '') => {
    if (!filesToProcess || !filesToProcess.length) return
    setLoading(true)
    setError(null)
    try {
      const data = await extractKnowledge(filesToProcess, customQ || question)
      setResult(data)
      setActiveTab('graph')
    } catch (err) {
      setError(err.response?.data?.detail || 'Knowledge extraction failed.')
    } finally {
      setLoading(false)
    }
  }

  const triggerGithubRepoAnalysis = async (urlToAnalyze) => {
    const targetUrl = urlToAnalyze || githubUrl.trim()
    if (!targetUrl) return
    setLoading(true)
    setError(null)
    setResult(null)
    setGithubAnalysis(null)
    setChatMsgs([])

    try {
      // 1. Analyze GitHub repository structure & details
      const gData = await analyzeGithubRepo(targetUrl)
      setGithubAnalysis(gData)

      // 2. Convert extracted repo files into browser File objects to extract Knowledge Graph!
      if (gData.extracted_files && gData.extracted_files.length > 0) {
        const repoFileObjects = gData.extracted_files.map(f => {
          const blob = new Blob([f.content || ''], { type: 'text/plain' })
          return new File([blob], f.filename || 'file.txt', { type: 'text/plain' })
        })
        setFiles(repoFileObjects)

        // 3. Extract living knowledge graph for repository files
        const kData = await extractKnowledge(repoFileObjects, `Repository analysis for ${gData.owner}/${gData.repo_name}`)
        setResult(kData)
      }
      setActiveTab('overview')
    } catch (err) {
      setError(err.response?.data?.detail || 'GitHub Repository Analysis failed. Ensure the repository is public.')
    } finally {
      setLoading(false)
    }
  }

  const handleExtract = () => {
    if (inputMode === 'github') {
      triggerGithubRepoAnalysis()
    } else {
      triggerExtraction(files, question)
    }
  }

  const handleAsk = async (overrideQ) => {
    const q = overrideQ || chatInput.trim()
    if (!q || chatLoading) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'user', content: q }])
    setChatLoading(true)
    try {
      const repoUrl = githubAnalysis?.url || githubUrl
      const context = githubAnalysis?.raw_summary_context || result?.summary || ''
      const res = await askGithubRepo(repoUrl, q, context)
      setChatMsgs(prev => [...prev, {
        role: 'assistant',
        content: res.answer,
        followups: res.follow_up_questions || []
      }])
    } catch (e) {
      setChatMsgs(prev => [...prev, { role: 'assistant', content: '⚠ ' + (e.response?.data?.detail || e.message) }])
    } finally {
      setChatLoading(false)
    }
  }

  const FILE_ICON = name => {
    const ext = name.split('.').pop().toLowerCase()
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️'
    if (ext === 'pdf') return '📕'
    if (['md','markdown'].includes(ext)) return '📝'
    if (['js','ts','py','jsx','tsx'].includes(ext)) return '💻'
    return '📄'
  }

  const complexityLevel = githubAnalysis?.complexity_score?.level || 'Medium'
  const complexityColor = {
    Low: '#34d399',
    Medium: '#38bdf8',
    High: '#fb923c',
    Enterprise: '#f472b6',
  }[complexityLevel] || '#38bdf8'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 max-w-6xl mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-purple-500/30 bg-purple-500/10">◈</div>
          <div>
            <h1 className="font-outfit font-800 text-3xl text-gradient-cyan" style={{fontWeight:800}}>Second Brain</h1>
            <p className="text-white/45 text-sm font-inter">Upload project files or analyze GitHub repositories to build a living knowledge graph</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Left Panel — Input Mode Switcher & Controls */}
        <div className="space-y-4 text-left">
          {/* Mode Switcher */}
          <div className="flex gap-1.5 p-1 glass rounded-xl bg-black/40 border border-white/5">
            <button
              onClick={() => { setInputMode('files'); setError(null) }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-outfit font-600 transition-all flex items-center justify-center gap-1.5 ${
                inputMode === 'files'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span>📁</span> Upload Files
            </button>
            <button
              onClick={() => { setInputMode('github'); setError(null) }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-outfit font-600 transition-all flex items-center justify-center gap-1.5 ${
                inputMode === 'github'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span>🐙</span> Analyze GitHub Repo
            </button>
          </div>

          {/* MODE 1: FILES UPLOAD */}
          {inputMode === 'files' && (
            <div className="space-y-4">
              <div {...getRootProps()} className={`drop-zone rounded-2xl p-7 text-center ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="text-3xl mb-2 opacity-25">◈</div>
                <p className="text-white/50 text-xs font-outfit">
                  {isDragActive ? 'Drop files here →' : 'Drop project files or click to browse'}
                </p>
                <p className="text-white/25 text-[11px] mt-1 font-inter">PDF · TXT · MD · Images · Code files</p>
              </div>

              {files.length > 0 && (
                <div className="glass rounded-xl p-3.5 space-y-2">
                  <p className="text-[11px] font-outfit text-white/35 uppercase tracking-widest mb-2">Project Files ({files.length})</p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {files.map(f => (
                      <div key={f.name} className="flex items-center gap-2 group">
                        <span className="text-sm">{FILE_ICON(f.name)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-xs font-outfit truncate">{f.name}</p>
                          <p className="text-white/30 text-[10px]">{(f.size/1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={() => removeFile(f.name)}
                          className="text-white/20 hover:text-red-400 transition-colors text-base opacity-0 group-hover:opacity-100"
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-outfit text-white/35 uppercase tracking-widest block mb-1.5">
                  Ask a specific question (optional)
                </label>
                <textarea
                  className="nexus-input resize-none text-xs"
                  rows={2}
                  placeholder={`"What am I missing?" or "What are the biggest risks?"`}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                />
              </div>

              <button
                onClick={handleExtract}
                disabled={!files.length || loading}
                className="btn-nexus w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><div className="flex gap-1"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div><span>Building Knowledge Graph…</span></>
                ) : (
                  <><span>◈</span><span>Extract Knowledge Graph</span></>
                )}
              </button>
            </div>
          )}

          {/* MODE 2: GITHUB REPO */}
          {inputMode === 'github' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-outfit text-cyan-300 uppercase tracking-widest block mb-1.5">
                  Public GitHub Repository URL
                </label>
                <input
                  type="text"
                  className="nexus-input w-full py-2.5 text-xs"
                  placeholder="https://github.com/owner/repository"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleExtract() }}
                />
              </div>

              <div>
                <p className="text-[11px] text-white/30 font-outfit mb-1.5">Try an open source repo:</p>
                <div className="flex flex-wrap gap-1.5">
                  {GITHUB_EXAMPLES.map(ex => (
                    <button
                      key={ex}
                      onClick={() => setGithubUrl(`https://github.com/${ex}`)}
                      className="text-[11px] glass px-2.5 py-1 rounded-full text-cyan-300/70 hover:text-cyan-200 border border-cyan-500/20 font-mono"
                    >
                      🐙 {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExtract}
                disabled={!githubUrl.trim() || loading}
                className="btn-nexus w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}
              >
                {loading ? (
                  <><div className="flex gap-1"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div><span>Reading &amp; Analyzing Repo…</span></>
                ) : (
                  <><span>🐙</span><span>Analyze &amp; Build Graph</span></>
                )}
              </button>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="glass rounded-xl p-3.5 border border-red-500/20 bg-red-500/5">
                <p className="text-red-400 text-xs font-outfit">⚠ {error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — Living Knowledge Graph + GitHub Analysis Dashboard */}
        <div className="space-y-4 text-left">
          {loading && (
            <div className="space-y-3">
              <div className="skeleton h-64 rounded-2xl" />
              <div className="skeleton h-32 rounded-xl" />
            </div>
          )}

          <AnimatePresence>
            {(result || githubAnalysis) && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                
                {/* Navigation Tabs */}
                <div className="flex gap-1 glass rounded-xl p-1 bg-black/40 border border-white/5">
                  {githubAnalysis && (
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-outfit font-600 transition-all ${
                        activeTab === 'overview'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      📋 Repo Analysis
                    </button>
                  )}
                  {result && (
                    <button
                      onClick={() => setActiveTab('graph')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-outfit font-600 transition-all ${
                        activeTab === 'graph'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      ◈ Living Knowledge Graph
                    </button>
                  )}
                  {result && (
                    <button
                      onClick={() => setActiveTab('gaps')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-outfit font-600 transition-all ${
                        activeTab === 'gaps'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      ⚠ Gaps ({result.gaps?.length || 0})
                    </button>
                  )}
                  {result && (
                    <button
                      onClick={() => setActiveTab('actions')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-outfit font-600 transition-all ${
                        activeTab === 'actions'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      → Actions ({result.next_actions?.length || 0})
                    </button>
                  )}
                </div>

                {/* TAB 1: GITHUB REPO ANALYSIS OVERVIEW */}
                {activeTab === 'overview' && githubAnalysis && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="glass rounded-xl p-5 border-cyan-500/20">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h2 className="font-outfit font-800 text-xl text-white/90">
                          {githubAnalysis.owner} / <span className="text-gradient-cyan">{githubAnalysis.repo_name}</span>
                        </h2>
                        <span className="px-2.5 py-1 rounded-full text-xs font-outfit font-700" style={{ background: `${complexityColor}20`, color: complexityColor, border: `1px solid ${complexityColor}40` }}>
                          {complexityLevel} Complexity
                        </span>
                      </div>
                      <p className="text-xs text-white/70 font-inter mb-3">{githubAnalysis.project_overview}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {githubAnalysis.tech_stack?.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[11px] font-outfit bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Features & Architecture */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="glass rounded-xl p-4">
                        <h3 className="text-xs font-outfit font-700 text-emerald-400 uppercase tracking-wider mb-2">⚡ Key Features</h3>
                        <ul className="space-y-1">
                          {githubAnalysis.features?.map((f, i) => (
                            <li key={i} className="text-xs text-white/75 font-inter">✓ {f}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="glass rounded-xl p-4">
                        <h3 className="text-xs font-outfit font-700 text-purple-400 uppercase tracking-wider mb-2">🎯 Problem Solved</h3>
                        <p className="text-xs text-white/75 font-inter">{githubAnalysis.problem_solved}</p>
                      </div>
                    </div>

                    {/* Important Files */}
                    <div className="glass rounded-xl p-4">
                      <h3 className="text-xs font-outfit font-700 text-amber-400 uppercase tracking-wider mb-2">📄 Important Files & Purpose</h3>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {githubAnalysis.important_files?.map((f, i) => (
                          <div key={i} className="flex justify-between gap-2 p-2 rounded bg-black/30 text-xs">
                            <span className="font-mono text-cyan-300">{f.path}</span>
                            <span className="text-white/60 truncate">{f.purpose}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LIVING KNOWLEDGE GRAPH */}
                {activeTab === 'graph' && result && (
                  <div className="space-y-4">
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="tag tag-purple">Living Knowledge Graph Ready</span>
                        <span className="text-white/30 text-xs font-outfit">
                          {result.nodes?.length} nodes · {result.edges?.length} connections
                        </span>
                      </div>
                      <p className="text-xs text-white/70 font-inter">{result.summary}</p>
                    </div>
                    <KnowledgeGraph nodes={result.nodes} edges={result.edges} />
                  </div>
                )}

                {/* TAB 3: GAPS */}
                {activeTab === 'gaps' && result && (
                  <div className="glass rounded-xl p-5 space-y-3">
                    <p className="text-xs font-outfit text-white/35 uppercase tracking-widest mb-3">Identified Gaps & Missing Information</p>
                    {result.gaps?.length > 0 ? result.gaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
                        <span className="text-orange-400 text-xs">⚠</span>
                        <p className="text-white/75 text-xs font-inter">{gap}</p>
                      </div>
                    )) : (
                      <p className="text-white/35 text-xs text-center py-4">No major gaps identified</p>
                    )}
                  </div>
                )}

                {/* TAB 4: ACTIONS */}
                {activeTab === 'actions' && result && (
                  <div className="glass rounded-xl p-5 space-y-3">
                    <p className="text-xs font-outfit text-white/35 uppercase tracking-widest mb-3">Recommended Next Actions</p>
                    {result.next_actions?.length > 0 ? result.next_actions.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                        <span className="text-green-400 font-mono text-xs">{String(i+1).padStart(2,'0')}</span>
                        <p className="text-white/75 text-xs font-inter">{action}</p>
                      </div>
                    )) : (
                      <p className="text-white/35 text-xs text-center py-4">No specific actions identified</p>
                    )}
                  </div>
                )}

                {/* Interactive Q&A Panel */}
                <div className="glass rounded-xl p-4 border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">💬</span>
                    <h3 className="font-outfit font-700 text-xs text-white/90 uppercase tracking-wider">Ask About This Knowledge Base</h3>
                  </div>

                  {chatMsgs.length > 0 && (
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto p-2.5 rounded-lg bg-black/40 border border-white/5">
                      {chatMsgs.map((m, i) => (
                        <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`p-2.5 rounded-lg text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap font-inter ${
                            m.role === 'user'
                              ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100'
                              : 'bg-white/5 border border-white/10 text-white/85'
                          }`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="text-xs text-cyan-400 font-outfit animate-pulse p-1">MINDX is thinking…</div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="nexus-input flex-1 text-xs py-2"
                      placeholder="Ask anything about the codebase or uploaded documents..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAsk() }}
                      disabled={chatLoading}
                    />
                    <button
                      onClick={() => handleAsk()}
                      disabled={!chatInput.trim() || chatLoading}
                      className="btn-nexus px-3 py-2 text-xs flex items-center gap-1 disabled:opacity-40"
                    >
                      <span>Ask</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {!result && !githubAnalysis && !loading && (
            <div className="glass rounded-2xl p-10 text-center h-80 flex items-center justify-center">
              <div>
                <div className="text-5xl mb-3 opacity-15">◈</div>
                <p className="text-white/40 font-outfit text-sm mb-1">Second Brain Knowledge Studio</p>
                <p className="text-white/25 font-inter text-xs">Upload project files or paste a GitHub repository URL to build an interactive knowledge graph.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
