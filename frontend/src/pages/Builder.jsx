import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { generateApp, fetchBuilderSuggestions, buildAppFromGithub, askGithubRepo } from '../services/api'

const EXAMPLES = [
  'Create a premium landing page for an AI startup',
  'Build a dark glassmorphism dashboard with charts',
  'Design a beautiful pricing page with 3 tiers',
  'Create a futuristic hero section with animations',
  'Build a contact form with glassmorphism style',
]

const GITHUB_EXAMPLES = [
  'fastapi/fastapi',
  'pallets/flask',
  'facebook/react',
  'octocat/Hello-World',
]

const CATEGORIES = [
  'All',
  'AI/ML',
  'Education',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Productivity',
  'Travel',
  'Social',
  'Developer Tools',
  'Business',
]

const DIFFICULTY_COLOR = {
  Beginner: 'tag-green',
  Intermediate: 'tag-cyan',
  Advanced: 'tag-purple',
}

const BUILD_FLOW_STEPS = [
  { id: 1, label: 'GitHub URL', icon: '🔗' },
  { id: 2, label: 'Repository Analysis', icon: '🔍' },
  { id: 3, label: 'Project Understanding', icon: '🧠' },
  { id: 4, label: 'Build Specification', icon: '📐' },
  { id: 5, label: 'Code Generation', icon: '⚡' },
  { id: 6, label: 'Live Preview', icon: '▶' },
]

export default function Builder() {
  const [mainMode, setMainMode] = useState('build') // 'build' | 'discover' | 'github'
  const [prompt, setPrompt] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [followup, setFollowup] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [githubResult, setGithubResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('preview') // 'preview' | 'code' | 'chat'
  const [history, setHistory] = useState([])
  const [buildStage, setBuildStage] = useState(1) // 1..6

  // Discover state
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Q&A state for Ask About Repository
  const [chatMsgs, setChatMsgs] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs])

  useEffect(() => {
    if (mainMode === 'discover') {
      loadSuggestions(selectedCategory)
    }
  }, [mainMode, selectedCategory])

  const loadSuggestions = async cat => {
    setLoadingSuggestions(true)
    try {
      const data = await fetchBuilderSuggestions(cat)
      setSuggestions(data.suggestions || [])
    } catch {
      // Ignore fallback
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleCopyCode = codeText => {
    if (!codeText) return
    navigator.clipboard.writeText(codeText)
    toast.success('Source code copied to clipboard!')
  }

  const handleDownloadCode = (codeText, filename = 'generated-app.html') => {
    if (!codeText) return
    const blob = new Blob([codeText], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}`)
  }

  // 1. Build My Idea / Discover Build
  const handleGenerate = async (isFollowup = false, overridePrompt = null) => {
    const text = overridePrompt || (isFollowup ? followup : prompt)
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    if (overridePrompt) {
      setPrompt(overridePrompt)
      setMainMode('build')
    }
    try {
      const data = await generateApp(text, isFollowup && result ? result : null)
      setResult(data)
      setHistory(prev => [...prev, { prompt: text, result: data }])
      setFollowup('')
      setActiveTab('preview')
    } catch (err) {
      setError(err.response?.data?.detail || 'Generation failed. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Build From GitHub
  const handleGithubBuild = async (overrideUrl = null, followupText = null) => {
    const url = overrideUrl || githubUrl.trim()
    if (!url && !followupText) return
    setLoading(true)
    setError(null)
    setBuildStage(2) // Repository Analysis

    const timer2 = setTimeout(() => setBuildStage(3), 1200) // Project Understanding
    const timer3 = setTimeout(() => setBuildStage(4), 2800) // Build Specification
    const timer4 = setTimeout(() => setBuildStage(5), 4500) // Code Generation

    try {
      const data = await buildAppFromGithub(url || (githubResult ? githubResult.repo_url : ''), followupText || null)
      setGithubResult(data)
      setBuildStage(6) // Live Preview
      setActiveTab('preview')
      if (followupText) setFollowup('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to build application from GitHub repository.')
      setBuildStage(1)
    } finally {
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      setLoading(false)
    }
  }

  // Ask About Repository Chat Handler
  const handleAskRepo = async (overrideQ = null) => {
    const q = overrideQ || chatInput.trim()
    if (!q || chatLoading || !githubResult) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'user', content: q }])
    setChatLoading(true)
    try {
      const res = await askGithubRepo(githubResult.repo_url, q, githubResult.raw_summary_context || '')
      setChatMsgs(prev => [...prev, {
        role: 'assistant',
        content: res.answer,
        followups: res.follow_up_questions || []
      }])
    } catch (err) {
      setChatMsgs(prev => [...prev, { role: 'assistant', content: '⚠ ' + (err.response?.data?.detail || err.message) }])
    } finally {
      setChatLoading(false)
    }
  }

  const copyCode = (codeText) => {
    navigator.clipboard.writeText(codeText || '')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 max-w-7xl mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-pink-500/30 bg-pink-500/10">◇</div>
          <div className="text-left">
            <h1 className="font-outfit font-800 text-3xl text-gradient-pink" style={{fontWeight:800}}>AI App Builder</h1>
            <p className="text-white/45 text-sm font-inter">Generate standalone working web applications from Prompts, Ideas, or GitHub Repositories</p>
          </div>
        </div>

        {/* 3-Option Mode Switcher Bar */}
        <div className="flex gap-1.5 glass p-1.5 rounded-2xl border border-white/10 flex-wrap">
          <button
            onClick={() => setMainMode('build')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-outfit text-xs sm:text-sm font-600 transition-all ${
              mainMode === 'build'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-lg shadow-pink-500/10 font-bold'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <span>🛠️</span>
            <span>BUILD MY IDEA</span>
          </button>
          <button
            onClick={() => setMainMode('discover')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-outfit text-xs sm:text-sm font-600 transition-all ${
              mainMode === 'discover'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10 font-bold'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <span>💡</span>
            <span>DISCOVER &amp; BUILD</span>
          </button>
          <button
            onClick={() => setMainMode('github')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-outfit text-xs sm:text-sm font-600 transition-all ${
              mainMode === 'github'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10 font-bold'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <span>🐙</span>
            <span>BUILD FROM GITHUB</span>
          </button>
        </div>
      </div>

      {/* MODE 1: BUILD MY IDEA */}
      {mainMode === 'build' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
          <div className="glass rounded-2xl p-6">
            <label className="text-xs font-outfit text-white/35 uppercase tracking-widest block mb-3">What do you want to build?</label>
            <div className="flex gap-3 mb-4">
              <textarea
                className="nexus-input resize-none flex-1 text-sm"
                rows={3}
                placeholder="e.g. Create a premium landing page for an AI startup with dark glassmorphism design..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-xs glass px-3 py-1.5 rounded-full text-white/50 hover:text-white/80 transition-all font-outfit border border-white/[0.06] truncate max-w-xs"
                  title={ex}
                >
                  {ex}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleGenerate(false)}
              disabled={!prompt.trim() || loading}
              className="btn-nexus flex items-center justify-center gap-2 px-8 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><div className="flex gap-1"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div><span>MINDX is building your app…</span></>
              ) : (
                <><span>◇</span><span>Generate App</span></>
              )}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                <p className="text-red-400 text-sm font-outfit">⚠ {error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated App Output */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="glass rounded-xl p-5 border-l-4 border-pink-500">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="font-outfit font-700 text-xl text-white/90 mb-1" style={{fontWeight:700}}>{result.app_name}</h2>
                      <p className="text-white/55 text-sm font-inter">{result.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.tech_stack?.map(t => (
                        <span key={t} className="tag tag-pink text-xs">{t}</span>
                      ))}
                    </div>
                  </div>

                  {result.components?.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {result.components.map((c, i) => (
                        <div key={i} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
                          <p className="font-mono text-pink-400 text-xs mb-1">{c.name}</p>
                          <p className="text-white/45 text-xs font-inter">{c.purpose}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 glass rounded-xl p-1">
                  {['preview', 'code'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-outfit capitalize transition-all ${
                        activeTab === tab ? 'bg-white/10 text-white font-medium' : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {tab === 'preview' ? '▶ Live Preview' : '{ } Source Code'}
                    </button>
                  ))}
                </div>

                {activeTab === 'preview' && result.code && (
                  <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-black/40">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                      </div>
                      <span className="text-xs text-white/30 font-mono ml-2">preview.html</span>
                      <span className="tag tag-green text-xs ml-auto">Live Sandbox</span>
                    </div>
                    <iframe
                      srcDoc={result.code}
                      title="Generated App Preview"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
                      className="w-full"
                      style={{ height: 560, border: 'none', background: '#050a12' }}
                    />
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                      <span className="text-xs text-white/40 font-mono">generated-app.html</span>
                      <button onClick={() => copyCode(result.code)} className="btn-ghost text-xs py-1.5 px-3">
                        Copy Code
                      </button>
                    </div>
                    <div className="code-block max-h-[520px]">
                      <SyntaxHighlighter
                        language="html"
                        style={vscDarkPlus}
                        customStyle={{ background: 'transparent', margin: 0, padding: '1rem' }}
                      >
                        {result.code}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}

                <div className="glass rounded-xl p-5">
                  <label className="text-xs font-outfit text-white/35 uppercase tracking-widest block mb-3">
                    Refine with a follow-up instruction
                  </label>
                  <div className="flex gap-3">
                    <input
                      className="nexus-input flex-1"
                      placeholder={`"Make it more futuristic" · "Add pricing cards" · "Add dark glassmorphism"`}
                      value={followup}
                      onChange={e => setFollowup(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGenerate(true)}
                    />
                    <button
                      onClick={() => handleGenerate(true)}
                      disabled={!followup.trim() || loading}
                      className="btn-ghost px-5 text-sm whitespace-nowrap disabled:opacity-40"
                    >
                      Refine →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !loading && (
            <div className="glass rounded-2xl p-16 text-center">
              <div className="text-6xl mb-4 opacity-15">◇</div>
              <p className="text-white/30 font-outfit text-lg mb-2">Describe what you want to build</p>
              <p className="text-white/20 text-sm font-inter">MINDX will generate a live, working prototype</p>
            </div>
          )}
        </motion.div>
      )}

      {/* MODE 2: DISCOVER & BUILD */}
      {mainMode === 'discover' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
          <div className="glass rounded-2xl p-4 overflow-x-auto">
            <div className="text-xs font-outfit text-white/35 uppercase tracking-widest px-2 mb-3">Explore Categories</div>
            <div className="flex gap-2 min-w-max">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-outfit transition-all ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-md shadow-cyan-500/10'
                      : 'bg-white/[0.03] text-white/50 hover:text-white/80 hover:bg-white/[0.07] border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loadingSuggestions ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((card, i) => (
                <motion.div
                  key={card.id || i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="glass rounded-2xl p-6 flex flex-col justify-between border border-white/10 hover:border-cyan-500/30 transition-all hover:shadow-xl hover:shadow-cyan-500/5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-cyan-400/80 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                        {card.category}
                      </span>
                      <span className={`tag text-xs ${DIFFICULTY_COLOR[card.difficulty] || 'tag-cyan'}`}>
                        {card.difficulty}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-outfit font-700 text-lg text-white group-hover:text-cyan-300 transition-colors mb-1.5" style={{fontWeight:700}}>
                        {card.name}
                      </h3>
                      <p className="text-white/60 text-xs font-inter leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {card.problem_solved && (
                      <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5 text-xs">
                        <span className="text-cyan-400/90 font-outfit font-semibold block mb-0.5">🎯 Problem Solved:</span>
                        <span className="text-white/50 leading-tight block">{card.problem_solved}</span>
                      </div>
                    )}

                    {card.key_features?.length > 0 && (
                      <div>
                        <span className="text-[11px] font-outfit uppercase tracking-widest text-white/35 block mb-1.5">Key Features</span>
                        <div className="flex flex-wrap gap-1.5">
                          {card.key_features.map((feat, fIdx) => (
                            <span key={fIdx} className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/[0.05]">
                              · {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => handleGenerate(false, card.prompt || `Build ${card.name}: ${card.description}`)}
                      disabled={loading}
                      className="btn-nexus w-full py-2.5 text-xs flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-cyan-500/20"
                    >
                      <span>◇</span>
                      <span>Build This App</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* MODE 3: BUILD FROM GITHUB */}
      {mainMode === 'github' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
          {/* GitHub Input Card */}
          <div className="glass rounded-2xl p-6 border-gradient">
            <label className="text-xs font-outfit text-purple-300 uppercase tracking-widest block mb-3 font-600">
              Public GitHub Repository URL
            </label>
            <div className="flex gap-3 mb-4 flex-col sm:flex-row">
              <input
                type="text"
                className="nexus-input flex-1 py-3 text-sm"
                placeholder="https://github.com/owner/repository  or  owner/repository"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleGithubBuild() }}
              />
              <button
                onClick={() => handleGithubBuild()}
                disabled={!githubUrl.trim() || loading}
                className="btn-nexus px-6 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}
              >
                {loading ? (
                  <><div className="flex gap-1"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div><span>Building App…</span></>
                ) : (
                  <><span>🐙</span><span>Analyze &amp; Build App</span></>
                )}
              </button>
            </div>

            {/* Quick Open Source Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/30 font-outfit">Try open source repository:</span>
              {GITHUB_EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => { setGithubUrl(`https://github.com/${ex}`); handleGithubBuild(`https://github.com/${ex}`) }}
                  className="text-xs glass px-3 py-1.5 rounded-full text-purple-300/80 hover:text-purple-200 hover:border-purple-400/40 font-mono border border-purple-500/20 transition-all"
                >
                  🐙 {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Stepper Flow */}
          {loading && (
            <div className="glass rounded-2xl p-6 border-purple-500/20">
              <p className="text-xs font-outfit text-purple-300 uppercase tracking-widest mb-4">Build Progress Flow</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {BUILD_FLOW_STEPS.map((step) => {
                  const isActive = buildStage === step.id
                  const isDone = buildStage > step.id
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        isActive
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-lg shadow-purple-500/20 scale-105'
                          : isDone
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : 'bg-white/[0.02] border-white/5 text-white/30'
                      }`}
                    >
                      <span className="text-lg">{step.icon}</span>
                      <span className="text-[11px] font-outfit font-600 text-center">{step.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse mt-1" />}
                      {isDone && <span className="text-[10px] text-green-400 font-bold">✓ Done</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                <p className="text-red-400 text-sm font-outfit">⚠ {error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated GitHub Web Application Results */}
          <AnimatePresence>
            {githubResult && !loading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Repository Breakdown Dashboard */}
                <div className="glass rounded-2xl p-6 border-l-4 border-purple-500 space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🐙</span>
                        <h2 className="font-outfit font-800 text-2xl text-white/90">
                          {githubResult.repo_owner} / <span className="text-gradient-cyan">{githubResult.repo_name}</span>
                        </h2>
                        <span className="tag tag-purple ml-2">Built Prototype</span>
                      </div>
                      <p className="text-white/70 text-sm font-inter leading-relaxed">{githubResult.app_name} — {githubResult.description}</p>
                    </div>

                    <a href={githubResult.repo_url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400/80 hover:underline font-outfit">
                      {githubResult.repo_url} ↗
                    </a>
                  </div>

                  {/* 4 Breakdown Cards */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Original Overview */}
                    <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
                      <span className="text-xs font-outfit text-cyan-400 uppercase tracking-wider block mb-1">📋 Original Overview</span>
                      <p className="text-xs text-white/60 font-inter line-clamp-3">{githubResult.original_overview}</p>
                    </div>

                    {/* 2. Tech Detected */}
                    <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
                      <span className="text-xs font-outfit text-pink-400 uppercase tracking-wider block mb-1">🛠️ Technologies</span>
                      <div className="flex flex-wrap gap-1">
                        {githubResult.technologies_detected?.map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 3. Features Extracted */}
                    <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
                      <span className="text-xs font-outfit text-emerald-400 uppercase tracking-wider block mb-1">⚡ Features Extracted</span>
                      <ul className="space-y-0.5">
                        {githubResult.features_extracted?.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-[10px] text-white/70 truncate">✓ {f}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 4. Files Analyzed */}
                    <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
                      <span className="text-xs font-outfit text-amber-400 uppercase tracking-wider block mb-1">📄 Files Analyzed ({githubResult.files_analyzed_count})</span>
                      <p className="text-[10px] font-mono text-amber-300/80 truncate">
                        {githubResult.files_analyzed?.slice(0, 3).join(', ')}...
                      </p>
                    </div>
                  </div>

                  {/* Build Spec Summary */}
                  {githubResult.build_spec && (
                    <div className="bg-black/40 p-3 rounded-xl border border-white/10 text-xs">
                      <span className="text-purple-300 font-outfit font-600 block mb-1">📐 Build Specification Rationale:</span>
                      <span className="text-white/60 leading-relaxed block">{githubResult.build_spec}</span>
                    </div>
                  )}
                </div>

                {/* Tabs for Preview, Code, and Ask Chat */}
                <div className="flex gap-1 glass rounded-xl p-1 bg-black/40 border border-white/5">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-outfit font-600 transition-all ${
                      activeTab === 'preview' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    ▶ Live Sandbox Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-outfit font-600 transition-all ${
                      activeTab === 'code' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {'{ }'} Generated Source Code
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-outfit font-600 transition-all ${
                      activeTab === 'chat' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    💬 Ask About Repository
                  </button>
                </div>

                {/* Live Preview */}
                {activeTab === 'preview' && githubResult.code && (
                  <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-black/40">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                      </div>
                      <span className="text-xs text-white/30 font-mono ml-2">{githubResult.repo_name}-web-app.html</span>
                      <span className="tag tag-purple text-xs ml-auto">Independent Live Implementation</span>
                    </div>
                    <iframe
                      srcDoc={githubResult.code}
                      title="Generated App Preview"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
                      className="w-full"
                      style={{ height: 560, border: 'none', background: '#050a12' }}
                    />
                  </div>
                )}

                {/* Source Code View */}
                {activeTab === 'code' && (
                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                      <span className="text-xs text-white/40 font-mono">{githubResult.repo_name}-web-app.html</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleCopyCode(githubResult.code)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                          <span>📋</span><span>Copy Code</span>
                        </button>
                        <button onClick={() => handleDownloadCode(githubResult.code, `${githubResult.repo_name}-app.html`)} className="btn-nexus text-xs py-1.5 px-3 flex items-center gap-1" style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)' }}>
                          <span>⬇</span><span>Download App</span>
                        </button>
                      </div>
                    </div>
                    <div className="code-block max-h-[520px]">
                      <SyntaxHighlighter
                        language="html"
                        style={vscDarkPlus}
                        customStyle={{ background: 'transparent', margin: 0, padding: '1rem' }}
                      >
                        {githubResult.code}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}

                {/* Ask About Repository Chat */}
                {activeTab === 'chat' && (
                  <div className="glass rounded-2xl p-6 border-purple-500/20 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💬</span>
                      <h3 className="font-outfit font-700 text-sm text-white/90 uppercase tracking-wider">Ask About Repository ({githubResult.repo_name})</h3>
                    </div>

                    {chatMsgs.length > 0 && (
                      <div className="space-y-3 max-h-72 overflow-y-auto p-3 rounded-xl bg-black/40 border border-white/5">
                        {chatMsgs.map((m, i) => (
                          <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap font-inter ${
                              m.role === 'user'
                                ? 'bg-purple-500/20 border border-purple-500/30 text-purple-100'
                                : 'bg-white/5 border border-white/10 text-white/85'
                            }`}>
                              {m.content}
                            </div>
                            {m.followups?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {m.followups.map((q, qIdx) => (
                                  <button
                                    key={qIdx}
                                    onClick={() => handleAskRepo(q)}
                                    className="text-[11px] font-outfit px-2.5 py-1 rounded-full bg-white/5 hover:bg-purple-500/10 text-white/50 hover:text-purple-300 border border-white/10 transition-colors"
                                  >
                                    {q}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="text-xs text-purple-400 font-outfit animate-pulse p-2">
                            MINDX is inspecting the repository context…
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="nexus-input flex-1 text-xs"
                        placeholder="Ask anything about the codebase (e.g. 'How does authentication work?' or 'Explain main.py')..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAskRepo() }}
                        disabled={chatLoading}
                      />
                      <button
                        onClick={() => handleAskRepo()}
                        disabled={!chatInput.trim() || chatLoading}
                        className="btn-nexus px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <span>Ask</span>
                        <span>➤</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Refine App Prompt Input */}
                <div className="glass rounded-xl p-5 border-purple-500/20">
                  <label className="text-xs font-outfit text-purple-300 uppercase tracking-widest block mb-2 font-600">
                    Refine Generated Web App with Follow-Up Instruction
                  </label>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <input
                      className="nexus-input flex-1 text-xs"
                      placeholder={`"Add live chart visualizer" · "Add user profile settings" · "Add dark glassmorphism theme"`}
                      value={followup}
                      onChange={e => setFollowup(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGithubBuild(null, followup)}
                    />
                    <button
                      onClick={() => handleGithubBuild(null, followup)}
                      disabled={!followup.trim() || loading}
                      className="btn-nexus px-6 text-xs whitespace-nowrap disabled:opacity-40 py-2.5"
                    >
                      Refine Web App →
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {!githubResult && !loading && (
            <div className="glass rounded-2xl p-16 text-center">
              <div className="text-6xl mb-4 opacity-15">🐙</div>
              <p className="text-white/30 font-outfit text-lg mb-2">Paste a public GitHub repository URL</p>
              <p className="text-white/20 text-sm font-inter">MINDX will analyze the codebase and generate an independent, working web application prototype</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
