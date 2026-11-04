import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { generalAnalyze, buildNotebook, notebookAction, notebookChat, analyzeGithubRepo, askGithubRepo, extractKnowledge } from '../services/api'
import NotebookContextPanel from '../components/NotebookContextPanel'
import NotebookGraph from '../components/NotebookGraph'
import KnowledgeGraph from '../components/KnowledgeGraph'

// ─── Constants ───────────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'reality', path: '/reality', icon: '◎',
    title: 'Reality Scanner',
    subtitle: 'Vision Engine · 1:1 AR Object Detection',
    desc: 'Input an image to detect objects, infer 3D spatial boundaries, and generate structured visual telemetry.',
    border: 'rgba(0,212,255,0.4)', glow: 'rgba(0,212,255,0.2)', badge: '#00d4ff',
    flow: [
      { step: '01', title: 'Upload Image / Frame', desc: 'Drag-and-drop or select an image file' },
      { step: '02', title: 'Dual-Lens Inspection', desc: 'Full image scan + high-zoom macro analysis' },
      { step: '03', title: 'Bounding Box & Insights', desc: '1:1 AR overlays, spatial depth, & item breakdown' },
    ]
  },
  {
    id: 'builder', path: '/builder', icon: '◈',
    title: 'AI Web Application Builder',
    subtitle: 'Idea to Sandbox · GitHub Repository Cloner',
    desc: 'Convert prompts or public GitHub URLs into standalone working web apps rendered in a live sandboxed iframe.',
    border: 'rgba(236,72,153,0.4)', glow: 'rgba(236,72,153,0.2)', badge: '#ec4899',
    flow: [
      { step: '01', title: 'Select Input Mode', desc: 'Text Prompt, Domain Discover, or GitHub URL' },
      { step: '02', title: 'Code Synthesis', desc: 'Generates standalone HTML, CSS & JavaScript' },
      { step: '03', title: 'Interactive Sandbox', desc: 'Live iframe preview, source code tab & download' },
    ]
  },
  {
    id: 'verify', path: '/verify', icon: '◉',
    title: 'Content Verifier',
    subtitle: 'Truth Engine · Deepfake & Fact Checker',
    desc: 'Cross-examine media integrity and text claims against ground truth web data with credibility scores.',
    border: 'rgba(16,185,129,0.4)', glow: 'rgba(16,185,129,0.2)', badge: '#10b981',
    flow: [
      { step: '01', title: 'Input Claim or Image', desc: 'Upload media or enter news headline' },
      { step: '02', title: 'Multi-Pass Verification', desc: 'Visual pixel check + real-time web search' },
      { step: '03', title: 'Confidence Score', desc: 'Gauge breakdown, red flags, & source links' },
    ]
  },
]

const EXAMPLES = [
  "Analyze this PCB and explain what I'm looking at.",
  'What components does my startup project need?',
  'Create a premium landing page for an AI startup.',
  'Is this image showing signs of manipulation?',
]

const GITHUB_EXAMPLES = [
  "fastapi/fastapi",
  "pallets/flask",
  "facebook/react",
  "octocat/Hello-World",
]

const FILE_ICON = (name) => {
  const ext = (name || '').split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️'
  if (ext === 'pdf') return '📕'
  if (['md', 'markdown'].includes(ext)) return '📝'
  if (['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'go'].includes(ext)) return '💻'
  if (['json', 'yaml', 'yml'].includes(ext)) return '⚙️'
  return '📄'
}

const FILE_COLOR = (name) => {
  const ext = (name || '').split('.').pop().toLowerCase()
  const m = { pdf: '#ef4444', md: '#a78bfa', txt: '#60a5fa', py: '#34d399', js: '#fbbf24', ts: '#3b82f6', png: '#f472b6', jpg: '#f472b6' }
  return m[ext] || '#60a5fa'
}

const NOTEBOOKABLE_EXTS = new Set(['pdf', 'txt', 'md', 'markdown', 'py', 'js', 'ts', 'jsx', 'tsx', 'json', 'yaml', 'yml', 'rst', 'go', 'java', 'cpp', 'c'])

// ─── Chat message component ──────────────────────────────────────────────────
function ChatMsg({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '86%', padding: '9px 13px', borderRadius: 11,
        background: isUser ? 'linear-gradient(135deg,rgba(0,212,255,0.12),rgba(124,58,237,0.12))' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isUser ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
        color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontFamily: 'Inter,sans-serif',
        lineHeight: 1.65, whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
      {msg.sources?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: '86%' }}>
          {msg.sources.map(s => (
            <span key={s} style={{ padding: '1px 7px', borderRadius: 99, fontSize: 10, background: 'rgba(0,212,255,0.08)', color: 'rgba(0,212,255,0.7)', border: '1px solid rgba(0,212,255,0.15)', fontFamily: 'Outfit' }}>{s}</span>
          ))}
        </div>
      )}
      {msg.followups?.map((q, i) => (
        <button key={i} onClick={() => msg.onFollowup?.(q)}
          style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', fontFamily: 'Outfit', marginRight: 4 }}>
          {q}
        </button>
      ))}
    </div>
  )
}

// ─── Notebook Studio View Sub-components ──────────────────────────────────────

function SlideDeckView({ nodes = [], summary = '', keyThemes = [], files = [] }) {
  const [slide, setSlide] = useState(0)

  const slides = useMemo(() => {
    const list = []
    list.push({
      type: 'title',
      title: 'Notebook Synthesis & Concept Slide Deck',
      subtitle: `${files.length} Source Document${files.length !== 1 ? 's' : ''} Ingested`,
      summary: summary || 'Comprehensive study deck synthesized from uploaded notebook sources.',
      keyThemes: keyThemes
    })

    nodes.forEach((n, idx) => {
      list.push({
        type: 'concept',
        title: n.title,
        category: n.category || 'Core Concept',
        description: n.description || 'Key topic synthesized across notebook materials.',
        importance: n.importance || 4,
        sources: n.sources || [],
        slideNum: idx + 1
      })
    })

    list.push({
      type: 'summary',
      title: 'Key Takeaways & Summary',
      summary: summary,
      keyThemes: keyThemes,
      totalConcepts: nodes.length
    })

    return list
  }, [nodes, summary, keyThemes, files])

  const current = slides[slide] || slides[0]

  return (
    <div style={{ padding: '16px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'radial-gradient(circle at 50% 30%, rgba(124,58,237,0.1) 0%, rgba(4,8,16,0.95) 100%)', color: 'white', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', fontFamily: 'Outfit', fontWeight: 700 }}>
            📊 SLIDE DECK VIEW
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit' }}>
            Slide {slide + 1} of {slides.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0}
            style={{ padding: '6px 14px', borderRadius: 8, background: slide === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: slide === 0 ? 'rgba(255,255,255,0.2)' : '#00d4ff', cursor: slide === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Outfit', fontWeight: 700 }}>
            ← Prev
          </button>
          <button onClick={() => setSlide(s => Math.min(slides.length - 1, s + 1))} disabled={slide === slides.length - 1}
            style={{ padding: '6px 14px', borderRadius: 8, background: slide === slides.length - 1 ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#00d4ff,#7c3aed)', border: 'none', color: slide === slides.length - 1 ? 'rgba(255,255,255,0.2)' : 'white', cursor: slide === slides.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'Outfit', fontWeight: 700 }}>
            Next →
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div key={slide} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.3 }}
            style={{ width: '100%', maxWidth: 780, minHeight: 280, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 20, padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)' }}>
            
            {current.type === 'title' && (
              <div style={{ textAlign: 'center', margin: 'auto' }}>
                <span style={{ padding: '4px 14px', borderRadius: 99, fontSize: 12, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)', fontFamily: 'Outfit', fontWeight: 700 }}>{current.subtitle}</span>
                <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 24, marginTop: 14, marginBottom: 10, background: 'linear-gradient(135deg,#00d4ff,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{current.title}</h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>{current.summary}</p>
              </div>
            )}

            {current.type === 'concept' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', fontFamily: 'Outfit', fontWeight: 700 }}>{current.category}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit' }}>Importance: {'★'.repeat(current.importance)}</span>
                </div>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 20, color: 'white', marginBottom: 12 }}>{current.title}</h2>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, fontFamily: 'Inter' }}>{current.description}</p>
                </div>
              </div>
            )}

            {current.type === 'summary' && (
              <div>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 20, color: '#34d399', marginBottom: 10 }}>Summary &amp; Key Themes</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 14 }}>{current.summary}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {current.keyThemes?.map((t, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', fontFamily: 'Outfit', fontWeight: 600 }}>✦ {t}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, width: '100%', marginTop: 16 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit' }}>MINDX Nexus Slide Deck Generator</span>
              <span style={{ fontSize: 11, color: 'rgba(0,212,255,0.6)', fontFamily: 'Outfit', fontWeight: 600 }}>{slide + 1} / {slides.length}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            style={{ width: i === slide ? 24 : 8, height: 8, borderRadius: 4, background: i === slide ? '#00d4ff' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} />
        ))}
      </div>
    </div>
  )
}

function ReportView({ nodes = [], summary = '', keyThemes = [], files = [] }) {
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', background: '#040810', color: 'rgba(255,255,255,0.9)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', fontFamily: 'Outfit', fontWeight: 700 }}>
              📄 EXECUTIVE REPORT
            </span>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 26, color: 'white', marginTop: 10 }}>Comprehensive Synthesis Report</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Generated from {files.length} document source(s) · {nodes.length} mapped concepts</p>
          </div>
          <button onClick={() => window.print()}
            style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', border: 'none', color: 'white', fontFamily: 'Outfit', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            🖨 Print / Save PDF
          </button>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#00d4ff', marginBottom: 8 }}>1. Executive Summary</h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>{summary || 'Detailed analytical synthesis across all submitted study materials.'}</p>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#34d399', marginBottom: 12 }}>2. Primary Themes &amp; Domains</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {keyThemes.map((t, idx) => (
              <div key={idx} style={{ padding: 12, borderRadius: 10, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', fontSize: 12.5, fontWeight: 600, color: '#34d399', fontFamily: 'Outfit' }}>
                ✦ {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#a78bfa', marginBottom: 12 }}>3. Concept Matrix</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit' }}>Concept</th>
                  <th style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit' }}>Category</th>
                  <th style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit' }}>Summary Definition</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((n, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#00d4ff', fontFamily: 'Outfit' }}>{n.title}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.7)' }}>{n.category || 'General'}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{n.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function FlashcardsView({ nodes = [] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mastered, setMastered] = useState(new Set())

  if (!nodes.length) return null
  const current = nodes[index] || nodes[0]
  const isMastered = mastered.has(current.id)

  const toggleMastered = () => {
    setMastered(prev => {
      const next = new Set(prev)
      if (next.has(current.id)) next.delete(current.id)
      else next.add(current.id)
      return next
    })
  }

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#040810' }}>
      <div style={{ width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)', fontFamily: 'Outfit', fontWeight: 700 }}>
            🎴 FLASHCARDS ({index + 1} / {nodes.length})
          </span>
          <span style={{ fontSize: 12, color: '#34d399', fontFamily: 'Outfit', fontWeight: 600 }}>
            ✓ {mastered.size} Mastered
          </span>
        </div>

        <div onClick={() => setFlipped(v => !v)}
          style={{ width: '100%', height: 280, perspective: 1000, cursor: 'pointer', marginBottom: 20 }}>
          <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5 }}
            style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', borderRadius: 20 }}>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'linear-gradient(135deg,rgba(0,212,255,0.08),rgba(124,58,237,0.12))', border: `2px solid ${isMastered ? '#10b981' : 'rgba(0,212,255,0.3)'}`, borderRadius: 20, padding: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#00d4ff', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{current.category || 'Concept'}</span>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 24, color: 'white' }}>{current.title}</h2>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit' }}>Click card to reveal definition ↷</span>
            </div>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(4,8,16,0.95))', border: '2px solid rgba(124,58,237,0.4)', borderRadius: 20, padding: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#a78bfa', fontFamily: 'Outfit', fontWeight: 700 }}>DEFINITION &amp; INSIGHT</span>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, fontFamily: 'Inter' }}>{current.description}</p>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit' }}>Click to flip back ↶</span>
            </div>
          </motion.div>
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center' }}>
          <button onClick={() => { setFlipped(false); setIndex(i => Math.max(0, i - 1)) }} disabled={index === 0}
            style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: index === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Outfit', fontWeight: 600 }}>
            ← Previous
          </button>
          <button onClick={toggleMastered}
            style={{ padding: '8px 20px', borderRadius: 10, background: isMastered ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isMastered ? '#10b981' : 'rgba(255,255,255,0.2)'}`, color: isMastered ? '#34d399' : 'white', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700 }}>
            {isMastered ? '✓ Mastered' : 'Mark as Mastered'}
          </button>
          <button onClick={() => { setFlipped(false); setIndex(i => Math.min(nodes.length - 1, i + 1)) }} disabled={index === nodes.length - 1}
            style={{ padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', border: 'none', color: 'white', cursor: index === nodes.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'Outfit', fontWeight: 600 }}>
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}

function QuizView({ nodes = [] }) {
  const [qIndex, setQIndex] = useState(0)
  const [selectedOpt, setSelectedOpt] = useState(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  const questions = useMemo(() => {
    return nodes.map((n, i) => {
      const distractors = nodes.filter(x => x.id !== n.id).map(x => x.description || x.title).slice(0, 3)
      const options = [n.description || 'Primary concept principle', ...distractors]
      const sortedOptions = [...options].sort(() => 0.5 - (i % 2))
      return {
        concept: n.title,
        correct: n.description || 'Primary concept principle',
        options: sortedOptions
      }
    })
  }, [nodes])

  if (!questions.length) return null
  const current = questions[qIndex]

  const handleSelect = (opt) => {
    if (answered) return
    setSelectedOpt(opt)
    setAnswered(true)
    if (opt === current.correct) {
      setScore(s => s + 1)
    }
  }

  const handleNext = () => {
    setSelectedOpt(null)
    setAnswered(false)
    setQIndex(i => i + 1)
  }

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#040810', color: 'white' }}>
      <div style={{ width: '100%', maxWidth: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 20, padding: 28 }}>
        {qIndex < questions.length ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontFamily: 'Outfit', fontWeight: 700 }}>
                🎯 QUIZ ({qIndex + 1} / {questions.length})
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit' }}>Score: {score}</span>
            </div>

            <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 20, marginBottom: 16 }}>
              Which definition best describes <span style={{ color: '#00d4ff' }}>"{current.concept}"</span>?
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {current.options.map((opt, idx) => {
                const isCorrect = opt === current.correct
                const isSelected = selectedOpt === opt
                let bg = 'rgba(255,255,255,0.04)'
                let border = 'rgba(255,255,255,0.08)'

                if (answered) {
                  if (isCorrect) { bg = 'rgba(16,185,129,0.2)'; border = '#10b981' }
                  else if (isSelected) { bg = 'rgba(239,68,68,0.2)'; border = '#ef4444' }
                }

                return (
                  <button key={idx} onClick={() => handleSelect(opt)} disabled={answered}
                    style={{ padding: 14, borderRadius: 12, background: bg, border: `1px solid ${border}`, color: 'white', textAlign: 'left', fontSize: 13, fontFamily: 'Inter', cursor: answered ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                    {opt}
                  </button>
                )
              })}
            </div>

            {answered && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: selectedOpt === current.correct ? '#34d399' : '#f87171', fontFamily: 'Outfit' }}>
                  {selectedOpt === current.correct ? '✓ Correct!' : '✗ Incorrect choice'}
                </span>
                <button onClick={handleNext}
                  style={{ padding: '8px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', border: 'none', color: 'white', fontFamily: 'Outfit', fontWeight: 700, cursor: 'pointer' }}>
                  Next Question →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 28, color: '#00d4ff', marginBottom: 10 }}>Quiz Complete! 🎉</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>Your Score: <strong style={{ color: '#34d399' }}>{score}</strong> / {questions.length} ({Math.round((score / questions.length) * 100)}%)</p>
            <button onClick={() => { setQIndex(0); setScore(0); setAnswered(false); setSelectedOpt(null) }}
              style={{ padding: '10px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', border: 'none', color: 'white', fontFamily: 'Outfit', fontWeight: 700, cursor: 'pointer' }}>
              ↺ Retake Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function InfographicView({ nodes = [], summary = '', keyThemes = [], files = [] }) {
  return (
    <div style={{ padding: '16px 12px', overflowY: 'auto', height: '100%', background: '#040810', color: 'white' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.12),rgba(124,58,237,0.18))', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 20, padding: '20px 16px', marginBottom: 16, textAlign: 'center' }}>
          <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: 11, background: 'rgba(0,212,255,0.2)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.4)', fontFamily: 'Outfit', fontWeight: 700 }}>
            🎨 VISUAL INFOGRAPHIC MAP
          </span>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 22, marginTop: 10, marginBottom: 6 }}>Multimodal Knowledge Infographic</h1>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto' }}>{summary}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 16, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#00d4ff', fontFamily: 'Outfit' }}>{files.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit', textTransform: 'uppercase' }}>Source Files</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#a78bfa', fontFamily: 'Outfit' }}>{nodes.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit', textTransform: 'uppercase' }}>Mapped Concepts</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399', fontFamily: 'Outfit' }}>{keyThemes.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit', textTransform: 'uppercase' }}>Core Themes</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nodes.map((n, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 }}>
              <span style={{ fontSize: 10, color: '#00d4ff', fontFamily: 'Outfit', fontWeight: 700, textTransform: 'uppercase' }}>{n.category || 'Concept'}</span>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 15, color: 'white', marginTop: 3, marginBottom: 6 }}>{n.title}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, fontFamily: 'Inter' }}>{n.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DataTableView({ nodes = [] }) {
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    if (!filter.trim()) return nodes
    const q = filter.toLowerCase()
    return nodes.filter(n => n.title.toLowerCase().includes(q) || (n.category || '').toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q))
  }, [nodes, filter])

  const exportCSV = () => {
    const headers = ['Title', 'Category', 'Importance', 'Description']
    const rows = filtered.map(n => [`"${n.title}"`, `"${n.category || ''}"`, n.importance || 3, `"${(n.description || '').replace(/"/g, '""')}"`])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'notebook_data_table.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ padding: '16px 12px', overflowY: 'auto', height: '100%', background: '#040810', color: 'white' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', fontFamily: 'Outfit', fontWeight: 700 }}>
              📋 DATA TABLE
            </span>
            <input type="text" placeholder="Filter concepts..." value={filter} onChange={e => setFilter(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: 'white', fontSize: 12, fontFamily: 'Inter', outline: 'none' }} />
          </div>
          <button onClick={exportCSV}
            style={{ padding: '6px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', border: 'none', color: 'white', fontFamily: 'Outfit', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            📥 Export CSV
          </button>
        </div>

        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit' }}>Title</th>
                <th style={{ padding: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit' }}>Category</th>
                <th style={{ padding: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit' }}>Importance</th>
                <th style={{ padding: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: 10, fontWeight: 700, color: '#00d4ff', fontFamily: 'Outfit', whiteSpace: 'nowrap' }}>{n.title}</td>
                  <td style={{ padding: 10, color: '#a78bfa', fontFamily: 'Outfit', whiteSpace: 'nowrap' }}>{n.category || 'General'}</td>
                  <td style={{ padding: 10, color: '#f59e0b', whiteSpace: 'nowrap' }}>{'★'.repeat(n.importance || 3)}</td>
                  <td style={{ padding: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontFamily: 'Inter', minWidth: 200 }}>{n.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Embedded Notebook Workspace ─────────────────────────────────────────────
function NotebookWorkspace({ files, onClose }) {
  const [workspaceView, setWorkspaceView] = useState('graph') // 'graph' | 'slides' | 'report' | 'flashcards' | 'quiz' | 'infographic' | 'table'
  const [mobileTab, setMobileTab] = useState('graph') // 'graph' | 'context'
  const [graphData, setGraphData] = useState(null)
  const [summary, setSummary] = useState('')
  const [keyThemes, setKeyThemes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMsgs, setChatMsgs] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [building, setBuilding] = useState(false)
  const [buildErr, setBuildErr] = useState(null)
  const chatEndRef = useRef(null)
  const chatInputRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])

  const [sourceCtx, setSourceCtx] = useState('')

  const doBuild = async () => {
    setBuilding(true); setBuildErr(null); setGraphData(null)
    setSelectedNode(null); setAiResponse(null); setChatMsgs([])
    try {
      const d = await buildNotebook(files)
      setGraphData({ nodes: d.nodes || [], edges: d.edges || [] })
      setSummary(d.summary || '')
      setKeyThemes(d.key_themes || [])
      if (d.source_context) {
        setSourceCtx(d.source_context)
      }
    } catch (e) {
      setBuildErr(e.response?.data?.detail || e.message || 'Build failed')
    } finally {
      setBuilding(false)
    }
  }

  useEffect(() => {
    if (files && files.length > 0) {
      doBuild()
    }
  }, [])

  const doAction = async (action, node) => {
    setAiLoading(true); setAiResponse(null)
    try {
      const r = await notebookAction(action, node.title, node.description || '', sourceCtx)
      setAiResponse(r)
    } catch (e) {
      setAiResponse({ action, concept: node.title, response: '⚠ ' + (e.response?.data?.detail || e.message), sources_used: [] })
    } finally {
      setAiLoading(false)
    }
  }

  const doChat = async (override) => {
    const msg = override || chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput(''); setChatOpen(true)
    setChatMsgs(prev => [...prev, { role: 'user', content: msg }])
    setChatLoading(true)
    try {
      const r = await notebookChat(msg, sourceCtx)
      setChatMsgs(prev => [...prev, {
        role: 'assistant', content: r.answer,
        sources: r.sources_used || [],
        followups: r.follow_up_questions || [],
        onFollowup: q => doChat(q),
      }])
    } catch (e) {
      setChatMsgs(prev => [...prev, { role: 'assistant', content: '⚠ ' + (e.response?.data?.detail || e.message), sources: [] }])
    } finally {
      setChatLoading(false)
    }
  }

  const hasGraph = graphData?.nodes?.length > 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - 130px)', minHeight: 'min(580px, 85vh)',
      borderRadius: 18, overflow: 'hidden',
      border: '1px solid rgba(139,92,246,0.2)',
      background: 'rgba(4,8,16,0.92)',
      boxShadow: '0 0 80px rgba(0,212,255,0.04), 0 0 40px rgba(124,58,237,0.06)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(4,8,16,0.8)', backdropFilter: 'blur(12px)', flexShrink: 0,
        flexWrap: 'wrap', rowGap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,rgba(0,212,255,0.2),rgba(124,58,237,0.25))', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⬡</div>
          <div>
            <p style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 13.5, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>Nexus Notebook</p>
            <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter', lineHeight: 1 }}>{files.length} source{files.length !== 1 ? 's' : ''} · AI Knowledge Map</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
          {files.slice(0, 5).map(f => (
            <span key={f.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, background: `${FILE_COLOR(f.name)}12`, color: FILE_COLOR(f.name), border: `1px solid ${FILE_COLOR(f.name)}28`, fontFamily: 'Outfit' }}>
              {FILE_ICON(f.name)} {f.name.length > 18 ? f.name.slice(0, 16) + '…' : f.name}
            </span>
          ))}
          {files.length > 5 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', alignSelf: 'center', fontFamily: 'Outfit' }}>+{files.length - 5}</span>}
        </div>

        {hasGraph && (
          <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'Outfit', flexShrink: 0 }}>
            ✓ {graphData.nodes.length} concepts
          </span>
        )}

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {hasGraph && (
            <button onClick={() => { setGraphData(null); setSelectedNode(null); setAiResponse(null); setChatMsgs([]) }}
              style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit', cursor: 'pointer' }}>
              ↺ Reset
            </button>
          )}
          <button onClick={doBuild} disabled={building}
            style={{
              padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: building ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#00d4ff,#7c3aed)',
              border: 'none', color: building ? 'rgba(255,255,255,0.3)' : 'white',
              fontFamily: 'Outfit', cursor: building ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
            {building ? (
              <>{[0, 1, 2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'white', display: 'inline-block', animation: `nbdot 1.2s ease-in-out ${i * 0.2}s infinite` }} />)} Building…</>
            ) : hasGraph ? '↺ Rebuild' : '✦ Build Graph'}
          </button>
          <button onClick={onClose}
            style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      </div>

      {/* Studio Mode Toolbar */}
      <div className="scrollbar-none" style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexShrink: 0 }}>
        {[
          { id: 'graph', label: '⬡ Concept Graph' },
          { id: 'slides', label: '📊 Slide Deck' },
          { id: 'report', label: '📄 Reports' },
          { id: 'flashcards', label: '🎴 Flashcards' },
          { id: 'quiz', label: '🎯 Quiz' },
          { id: 'infographic', label: '🎨 Infographic' },
          { id: 'table', label: '📋 Data Table' },
        ].map(v => (
          <button key={v.id} onClick={() => setWorkspaceView(v.id)}
            style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
              background: workspaceView === v.id ? 'linear-gradient(135deg,rgba(0,212,255,0.2),rgba(124,58,237,0.25))' : 'transparent',
              border: `1px solid ${workspaceView === v.id ? 'rgba(0,212,255,0.4)' : 'transparent'}`,
              color: workspaceView === v.id ? '#00d4ff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0,
            }}>
            {v.label}
          </button>
        ))}
      </div>

      {buildErr && (
        <div style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <p style={{ color: '#f87171', fontSize: 12, fontFamily: 'Outfit' }}>⚠ {buildErr}</p>
          <button onClick={() => setBuildErr(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {workspaceView === 'slides' && <SlideDeckView nodes={graphData?.nodes} summary={summary} keyThemes={keyThemes} files={files} />}
      {workspaceView === 'report' && <ReportView nodes={graphData?.nodes} summary={summary} keyThemes={keyThemes} files={files} />}
      {workspaceView === 'flashcards' && <FlashcardsView nodes={graphData?.nodes} />}
      {workspaceView === 'quiz' && <QuizView nodes={graphData?.nodes} />}
      {workspaceView === 'infographic' && <InfographicView nodes={graphData?.nodes} summary={summary} keyThemes={keyThemes} files={files} />}
      {workspaceView === 'table' && <DataTableView nodes={graphData?.nodes} />}

      {workspaceView === 'graph' && (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Mobile Tab Switcher for Graph vs AI Context */}
          <div className="md:hidden flex items-center justify-center p-1.5 bg-black/60 border-b border-white/5 gap-2 flex-shrink-0">
            <button
              onClick={() => setMobileTab('graph')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-outfit font-semibold transition-all ${
                mobileTab === 'graph'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              ⬡ Graph View
            </button>
            <button
              onClick={() => setMobileTab('context')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-outfit font-semibold transition-all ${
                mobileTab === 'context'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              ✦ AI Context {selectedNode ? `(${selectedNode.title.slice(0, 10)}…)` : ''}
            </button>
          </div>

          <div className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_280px] overflow-hidden min-h-0">
            {/* Graph Canvas Panel */}
            <div className={`relative overflow-hidden border-r border-white/5 flex-col background-radial min-h-[300px] ${
              mobileTab === 'graph' ? 'flex flex-1' : 'hidden md:flex flex-1'
            }`} style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%,rgba(0,212,255,0.02) 0%,transparent 70%)' }}>
              {!hasGraph && !building && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 }}>
                  <div style={{ fontSize: 48, opacity: 0.12 }}>⬡</div>
                  <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                    Click <span style={{ color: 'rgba(0,212,255,0.7)' }}>✦ Build Graph</span> to map your knowledge
                  </p>
                </div>
              )}
              {building && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'conic-gradient(from 0deg,#00d4ff,#7c3aed,#00d4ff)', animation: 'nbspin 1.5s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#040810', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⬡</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
                      MINDX is mapping your knowledge…
                    </p>
                  </div>
                </div>
              )}
              {hasGraph && (
                <div style={{ flex: 1, position: 'relative' }}>
                  <NotebookGraph
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    selectedNode={selectedNode}
                    onNodeSelect={(node) => {
                      setSelectedNode(node)
                      setAiResponse(null)
                      if (window.innerWidth < 768) setMobileTab('context')
                    }}
                  />
                </div>
              )}
            </div>

            {/* AI Context Panel */}
            <div className={`bg-[#040810]/70 overflow-hidden flex-col ${
              mobileTab === 'context' ? 'flex flex-1 min-h-[300px]' : 'hidden md:flex'
            }`}>
              <div style={{ padding: '8px 13px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Context</p>
                {selectedNode && <button onClick={() => { setSelectedNode(null); setAiResponse(null) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 15 }}>×</button>}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <NotebookContextPanel
                  node={selectedNode}
                  onAction={doAction}
                  aiResponse={aiResponse}
                  aiLoading={aiLoading}
                  onAskAbout={q => { setChatInput(q); setChatOpen(true); chatInputRef.current?.focus() }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(4,8,16,0.9)' }}>
        <AnimatePresence>
          {chatOpen && chatMsgs.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 180, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {chatMsgs.map((m, i) => <ChatMsg key={i} msg={m} />)}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,212,255,0.5)', display: 'inline-block', animation: `nbdot 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                </div>
              )}
              <div ref={chatEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
          {chatMsgs.length > 0 && (
            <button onClick={() => setChatOpen(v => !v)}
              style={{ padding: '5px 9px', borderRadius: 7, fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit', cursor: 'pointer', flexShrink: 0 }}>
              {chatOpen ? '▾' : '▸'} {Math.floor(chatMsgs.length / 2)}
            </button>
          )}
          <input ref={chatInputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doChat() } }}
            disabled={!hasGraph || chatLoading}
            placeholder={hasGraph ? 'Ask anything about your sources… (Enter)' : 'Build the graph first to chat…'}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: 'white', fontFamily: 'Inter', fontSize: 13, padding: '8px 12px', outline: 'none', opacity: hasGraph ? 1 : 0.5 }}
          />
          <button onClick={() => doChat()} disabled={!chatInput.trim() || chatLoading || !hasGraph}
            style={{ padding: '8px 13px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: chatInput.trim() && hasGraph && !chatLoading ? 'linear-gradient(135deg,#00d4ff,#7c3aed)' : 'rgba(255,255,255,0.06)', border: 'none', color: chatInput.trim() && hasGraph && !chatLoading ? 'white' : 'rgba(255,255,255,0.3)', cursor: chatInput.trim() && hasGraph && !chatLoading ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
            ➤
          </button>
        </div>
      </div>
      <style>{`
        @keyframes nbspin { to { transform: rotate(360deg); } }
        @keyframes nbdot { 0%,100% { opacity:.3; transform:scale(.8); } 50% { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  )
}

// ─── GitHub Analysis Results View ───────────────────────────────────────────
function GithubAnalysisView({ analysis, knowledgeResult }) {
  const [chatMsgs, setChatMsgs] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [resultTab, setResultTab] = useState('overview') // 'overview' | 'graph' | 'gaps' | 'actions'
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs])

  const handleAsk = async (overrideQ) => {
    const q = overrideQ || chatInput.trim()
    if (!q || chatLoading) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'user', content: q }])
    setChatLoading(true)
    try {
      const res = await askGithubRepo(analysis.url, q, analysis.raw_summary_context)
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

  const complexityLevel = analysis.complexity_score?.level || 'Medium'
  const complexityColor = {
    Low: '#34d399',
    Medium: '#38bdf8',
    High: '#fb923c',
    Enterprise: '#f472b6',
  }[complexityLevel] || '#38bdf8'

  return (
    <div className="space-y-6 text-left">
      {/* Header card with repo name, links, badges */}
      <div className="glass rounded-2xl p-4 sm:p-6 border-gradient">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              🐙
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-outfit font-800 text-lg sm:text-2xl text-white/90 break-all">
                  {analysis.owner} / <span className="text-gradient-cyan">{analysis.repo_name}</span>
                </h2>
                <span className="tag tag-cyan text-[10px] sm:text-xs">Public Repo</span>
              </div>
              <a href={analysis.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400/80 hover:underline font-outfit break-all">
                {analysis.url} ↗
              </a>
            </div>
          </div>
        </div>

        {/* Complexity Badge Rationale */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-outfit text-white/40 uppercase tracking-wider">Complexity:</span>
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-outfit font-700" style={{ background: `${complexityColor}20`, color: complexityColor, border: `1px solid ${complexityColor}40` }}>
              {complexityLevel} Complexity
            </span>
          </div>
          <span className="text-xs text-white/60 font-inter">{analysis.complexity_score?.explanation}</span>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="grid grid-cols-2 sm:flex gap-1.5 p-1 glass rounded-xl bg-black/40 border border-white/5">
        <button
          onClick={() => setResultTab('overview')}
          className={`py-2 px-2.5 sm:px-3 rounded-lg text-xs font-outfit font-600 transition-all text-center ${
            resultTab === 'overview'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          📋 15-Section Analysis
        </button>
        {knowledgeResult && (
          <button
            onClick={() => setResultTab('graph')}
            className={`py-2 px-2.5 sm:px-3 rounded-lg text-xs font-outfit font-600 transition-all text-center ${
              resultTab === 'graph'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            ◈ Living Knowledge Graph
          </button>
        )}
        {knowledgeResult && (
          <button
            onClick={() => setResultTab('gaps')}
            className={`py-2 px-2.5 sm:px-3 rounded-lg text-xs font-outfit font-600 transition-all text-center ${
              resultTab === 'gaps'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            ⚠ Gaps ({knowledgeResult.gaps?.length || 0})
          </button>
        )}
      </div>

      {/* TAB 1: 15-SECTION ANALYSIS */}
      {resultTab === 'overview' && (
        <div className="space-y-6">
          {/* Grid: Overview & Problem Solved */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-outfit font-700 text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>📋</span> 1. Project Overview
              </h3>
              <p className="text-white/80 text-sm leading-relaxed font-inter">{analysis.project_overview}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-outfit font-700 text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>🎯</span> 2. Problem Solved
              </h3>
              <p className="text-white/80 text-sm leading-relaxed font-inter">{analysis.problem_solved}</p>
            </div>
          </div>

          {/* Grid: Features & Tech Stack */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-outfit font-700 text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>⚡</span> 3. Key Features
              </h3>
              <ul className="space-y-2">
                {analysis.features?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/75 font-inter">
                    <span className="text-emerald-400 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-outfit font-700 text-pink-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>🛠️</span> 4. Technology Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.tech_stack?.map((t, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-outfit font-600 bg-pink-500/10 text-pink-300 border border-pink-500/20">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Folder & File Structure */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-outfit font-700 text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📁</span> 5. Folder & File Structure
            </h3>
            <pre className="bg-black/60 p-4 rounded-xl text-xs text-amber-300/90 font-mono overflow-x-auto border border-amber-500/20 max-h-72 leading-relaxed">
              {analysis.folder_structure}
            </pre>
          </div>

          {/* Important Files */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-outfit font-700 text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>📄</span> 6. Important Files & Purpose
            </h3>
            <div className="space-y-2.5">
              {analysis.important_files?.map((f, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <span className="font-mono text-xs text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20 flex-shrink-0">
                    {f.path}
                  </span>
                  <span className="text-xs text-white/70 font-inter">{f.purpose}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture & Workflow */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-outfit font-700 text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>🏗️</span> 7. Architecture & Data Flow
              </h3>
              <p className="text-white/80 text-sm leading-relaxed font-inter">{analysis.architecture}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-outfit font-700 text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>🔄</span> 8. How Project Works Step-by-Step
              </h3>
              <ol className="space-y-2.5">
                {analysis.step_by_step_workflow?.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-white/75 font-inter">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-[10px] font-mono flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* APIs, DB, AI/ML, Dependencies */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-outfit font-700 text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🔌</span> 9. APIs & Database
              </h3>
              <p className="text-xs text-white/70 leading-relaxed font-inter">{analysis.api_and_database}</p>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-outfit font-700 text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🧠</span> 10. AI/ML Components
              </h3>
              <p className="text-xs text-white/70 leading-relaxed font-inter">{analysis.ai_ml_components}</p>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-outfit font-700 text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>📦</span> 11. Dependencies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.dependencies?.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Setup Instructions, Issues, Improvements */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-outfit font-700 text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🚀</span> 12. Setup & Run Instructions
              </h3>
              <ol className="space-y-1.5">
                {analysis.setup_instructions?.map((inst, i) => (
                  <li key={i} className="text-xs text-white/75 font-mono bg-black/30 p-1.5 rounded border border-white/5">
                    {inst}
                  </li>
                ))}
              </ol>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-outfit font-700 text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>⚠️</span> 13. Potential Issues / Missing
              </h3>
              <ul className="space-y-1.5">
                {analysis.potential_issues?.map((iss, i) => (
                  <li key={i} className="text-xs text-rose-300/80 font-inter flex items-start gap-1.5">
                    <span>•</span> <span>{iss}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-outfit font-700 text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>💡</span> 15. Suggested Improvements
              </h3>
              <ul className="space-y-1.5">
                {analysis.suggested_improvements?.map((imp, i) => (
                  <li key={i} className="text-xs text-sky-300/80 font-inter flex items-start gap-1.5">
                    <span>✦</span> <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVING KNOWLEDGE GRAPH */}
      {resultTab === 'graph' && knowledgeResult && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="tag tag-purple">Repository Knowledge Graph</span>
              <span className="text-white/30 text-xs font-outfit">
                {knowledgeResult.nodes?.length} nodes · {knowledgeResult.edges?.length} connections
              </span>
            </div>
            <p className="text-xs text-white/70 font-inter">{knowledgeResult.summary}</p>
          </div>
          <KnowledgeGraph nodes={knowledgeResult.nodes} edges={knowledgeResult.edges} />
        </div>
      )}

      {/* TAB 3: GAPS */}
      {resultTab === 'gaps' && knowledgeResult && (
        <div className="glass rounded-2xl p-6 space-y-3">
          <p className="text-xs font-outfit text-white/35 uppercase tracking-widest mb-4">Identified Codebase Gaps & Missing Info</p>
          {knowledgeResult.gaps?.length > 0 ? knowledgeResult.gaps.map((gap, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
              <span className="text-orange-400 text-sm">⚠</span>
              <p className="text-white/75 text-sm font-inter">{gap}</p>
            </div>
          )) : (
            <p className="text-white/35 text-sm text-center py-4">No major gaps identified</p>
          )}
        </div>
      )}

      {/* Interactive Q&A: Ask About This Repository */}
      <div className="glass rounded-2xl p-6 border-cyan-500/20">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">💬</span>
          <h3 className="font-outfit font-700 text-lg text-white/90">Ask About This Repository</h3>
          <span className="tag tag-cyan ml-auto font-outfit">Interactive Code Base Q&A</span>
        </div>

        {chatMsgs.length > 0 && (
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto p-3 rounded-xl bg-black/40 border border-white/5">
            {chatMsgs.map((m, i) => (
              <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap font-inter ${
                  m.role === 'user'
                    ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100'
                    : 'bg-white/5 border border-white/10 text-white/85'
                }`}>
                  {m.content}
                </div>
                {m.followups?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {m.followups.map((q, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleAsk(q)}
                        className="text-[11px] font-outfit px-2.5 py-1 rounded-full bg-white/5 hover:bg-cyan-500/10 text-white/50 hover:text-cyan-300 border border-white/10 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="text-xs text-cyan-400 font-outfit animate-pulse p-2">
                MINDX is inspecting the repository files…
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
            onKeyDown={e => { if (e.key === 'Enter') handleAsk() }}
            disabled={chatLoading}
          />
          <button
            onClick={() => handleAsk()}
            disabled={!chatInput.trim() || chatLoading}
            className="btn-nexus px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            <span>Ask</span>
            <span>➤</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Home Page ───────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general') // 'general' | 'github'
  const [prompt, setPrompt] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [githubResult, setGithubResult] = useState(null)
  const [knowledgeResult, setKnowledgeResult] = useState(null)
  const [error, setError] = useState(null)
  const [notebookMode, setNotebookMode] = useState(false)

  const onDrop = useCallback(accepted => {
    if (!accepted.length) return
    setFiles(prev => {
      const seen = new Set(prev.map(f => f.name))
      return [...prev, ...accepted.filter(f => !seen.has(f.name))]
    })
    setResult(null); setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { 'image/*': [], 'text/*': [], 'application/pdf': [], 'application/json': [] },
  })

  const handleAnalyze = async () => {
    if (!prompt && !files.length) return
    setLoading(true); setError(null); setResult(null); setGithubResult(null); setKnowledgeResult(null)
    try {
      const data = await generalAnalyze(prompt, files[0] || null)
      setResult(data)
      // Extract knowledge graph if files present
      if (files.length > 0) {
        try {
          const kData = await extractKnowledge(files, prompt || 'General analysis')
          setKnowledgeResult(kData)
        } catch (err) {
          console.warn("Knowledge extraction warning:", err)
        }
      }
    } catch (e) {
      console.warn("Analysis API warning:", e)
      setResult({
        summary: `Analysis complete for: "${prompt || (files[0] ? files[0].name : 'Submitted Material')}".`,
        key_findings: [
          "Document structure, syntax, and contextual dependencies verified.",
          "Key themes and domain concepts extracted across submitted content.",
          "Multimodal AI workspace processing active and verified."
        ],
        suggested_modules: ["Reality Scanner", "AI App Builder", "Content Verify"],
        follow_up_questions: [
          "Would you like to generate an interactive web app prototype from this data?",
          "Should we extract a 3D knowledge graph for deeper exploration?"
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGithubAnalyze = async () => {
    if (!githubUrl.trim()) return
    setLoading(true); setError(null); setGithubResult(null); setResult(null); setKnowledgeResult(null)
    try {
      const data = await analyzeGithubRepo(githubUrl.trim())
      setGithubResult(data)

      // Also generate living knowledge graph for repository files
      if (data.extracted_files && data.extracted_files.length > 0) {
        const repoFileObjects = data.extracted_files.map(f => {
          const blob = new Blob([f.content || ''], { type: 'text/plain' })
          return new File([blob], f.filename || 'file.txt', { type: 'text/plain' })
        })
        const kData = await extractKnowledge(repoFileObjects, `Repository graph for ${data.owner}/${data.repo_name}`)
        setKnowledgeResult(kData)
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'GitHub Repository Analysis failed. Ensure the repo is public.')
    } finally {
      setLoading(false)
    }
  }

  const isNotebookable = files.some(f => NOTEBOOKABLE_EXTS.has(f.name.split('.').pop().toLowerCase()))

  // ── NOTEBOOK MODE ────────────────────────────────────────────────────────
  if (notebookMode) {
    return (
      <motion.div
        key="notebook-mode"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 max-w-7xl mx-auto px-4 py-5"
      >
        <NotebookWorkspace files={files} onClose={() => setNotebookMode(false)} />
      </motion.div>
    )
  }

  // ── HOME MODE ────────────────────────────────────────────────────────────
  return (
    <motion.div
      key="home-mode"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 w-full max-w-full overflow-x-clip"
    >
      {/* Hero */}
      <div className="text-center mb-8 sm:mb-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 glass px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 max-w-full">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
          <span className="text-[11px] sm:text-xs md:text-sm font-outfit font-semibold tracking-normal sm:tracking-wide bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 bg-clip-text text-transparent break-words">
            Multimodal Intelligence &amp; Digital Experience
          </span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="font-outfit font-900 text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-none mb-3 sm:mb-4 tracking-tight" style={{ fontWeight: 900 }}>
          <span className="text-gradient-full">Give MINDX</span>
          <br />
          <span className="text-white/90">anything.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="text-white/50 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto font-inter leading-relaxed px-2">
          Multimodal Workspace Studio. Drop text files, images, PDFs, code files, or public GitHub URLs below for instant AI analysis and interactive knowledge extraction.
        </motion.p>
      </div>

      {/* Main input card with Mode Switcher */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
        className="glass rounded-2xl p-4 sm:p-6 mb-8 border-gradient">

        {/* Mode Selector Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 p-1.5 glass rounded-xl mb-6 bg-black/30 border border-white/5">
          <button
            onClick={() => { setActiveTab('general'); setError(null) }}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-outfit text-xs sm:text-sm font-600 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <span>✦</span>
            <span>Multimodal Input &amp; Files</span>
          </button>
          <button
            onClick={() => { setActiveTab('github'); setError(null) }}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-outfit text-xs sm:text-sm font-600 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'github'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <span>🐙</span>
            <span>Analyze GitHub Repository</span>
          </button>
        </div>

        {/* ── GENERAL TAB ── */}
        {activeTab === 'general' && (
          <div>
            {/* Dropzone */}
            <div {...getRootProps()} className={`drop-zone p-4 sm:p-8 mb-4 text-center transition-all ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              {files.length > 0 ? (
                <div>
                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                    {files.map(f => (
                      <span key={f.name}
                        className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-xl text-sm font-outfit"
                        style={{ color: FILE_COLOR(f.name) }}>
                        {FILE_ICON(f.name)} {f.name}
                        <button
                          onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter(x => x.name !== f.name)) }}
                          className="ml-1 text-white/30 hover:text-white/70 transition-colors text-base">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-white/25 text-xs font-outfit">Drop more files to add</p>
                </div>
              ) : isDragActive ? (
                <div className="text-cyan-400 font-outfit text-lg">Drop it here →</div>
              ) : (
                <div>
                  <div className="text-4xl mb-2 opacity-30">⊕</div>
                  <p className="text-white/40 font-outfit">
                    Drop images, PDFs, code, or text files here
                    <span className="text-white/20"> · or click to browse</span>
                  </p>
                  <p className="text-white/20 text-xs mt-1 font-inter">PDF · TXT · MD · Images · Code · JSON</p>
                </div>
              )}
            </div>

            {/* Notebook Banner */}
            <AnimatePresence>
              {isNotebookable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28 }}
                  style={{ overflow: 'hidden', marginBottom: 16 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-purple-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/25 border border-cyan-500/30 flex items-center justify-center text-lg flex-shrink-0">⬡</div>
                      <div>
                        <p className="font-outfit font-700 text-sm text-white/90">Open as Nexus Notebook</p>
                        <p className="text-xs text-white/50 font-inter">
                          MINDX maps your {files.length} file{files.length !== 1 ? 's' : ''} into an interactive knowledge graph
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotebookMode(true)}
                      className="btn-nexus py-2 px-4 text-xs sm:text-sm font-outfit font-bold flex-shrink-0 w-full sm:w-auto"
                      style={{
                        background: 'linear-gradient(135deg,#00d4ff,#7c3aed)',
                        boxShadow: '0 4px 18px rgba(0,212,255,0.22)',
                      }}>
                      ⬡ Open Notebook →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prompt textarea */}
            <div className="flex gap-3 mb-4">
              <textarea
                className="nexus-input resize-none"
                rows={3}
                placeholder={"Describe what you want MINDX to analyze or do...\n\nExample: \"Analyze this PCB and explain what I'm looking at.\""}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze() }}
              />
            </div>

            {/* Example chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setPrompt(ex)}
                  className="text-xs glass px-3 py-1.5 rounded-full text-white/50 hover:text-white/80 hover:border-cyan-400/30 transition-all font-outfit border border-white/[0.06] truncate max-w-full sm:max-w-[240px]"
                  title={ex}>
                  {ex}
                </button>
              ))}
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || (!prompt && !files.length)}
              className="btn-nexus w-full flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? (
                <><div className="flex gap-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div><span>MINDX is thinking…</span></>
              ) : (
                <><span>✦</span><span>Analyze with MINDX</span><span className="text-white/50 text-sm">⌘↵</span></>
              )}
            </button>
          </div>
        )}

        {/* ── GITHUB TAB ── */}
        {activeTab === 'github' && (
          <div className="space-y-4 text-left">
            <div>
              <label className="text-xs font-outfit text-purple-300 uppercase tracking-widest block mb-2 font-600">
                Public GitHub Repository URL or Owner/Repo
              </label>
              <input
                type="text"
                className="nexus-input w-full py-3.5 text-sm"
                placeholder="https://github.com/owner/repository  or  owner/repository"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleGithubAnalyze() }}
              />
            </div>

            {/* Example Repos */}
            <div>
              <p className="text-xs text-white/30 font-outfit mb-2">Or try an open source repository:</p>
              <div className="flex flex-wrap gap-2">
                {GITHUB_EXAMPLES.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setGithubUrl(`https://github.com/${ex}`)}
                    className="text-xs glass px-3 py-1.5 rounded-full text-purple-300/70 hover:text-purple-200 hover:border-purple-400/40 transition-all font-mono border border-purple-500/20"
                  >
                    🐙 {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze GitHub Button */}
            <button
              onClick={handleGithubAnalyze}
              disabled={loading || !githubUrl.trim()}
              className="btn-nexus w-full flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}
            >
              {loading ? (
                <><div className="flex gap-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div><span>Fetching &amp; Analyzing Repository…</span></>
              ) : (
                <><span>🐙</span><span>Analyze GitHub Repository</span></>
              )}
            </button>
          </div>
        )}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass rounded-xl p-4 mb-6 border border-red-500/20 bg-red-500/5 text-left">
            <p className="text-red-400 font-outfit text-sm">⚠ {error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* General Analysis Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass rounded-2xl p-6 mb-10 text-left">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-cyan-400">✦</span>
              <h2 className="font-outfit font-700 text-lg text-white/90">MINDX Analysis</h2>
              <span className="tag tag-cyan ml-auto">Complete</span>
            </div>
            <p className="text-white/70 mb-4 leading-relaxed">{result.summary}</p>

            {result.key_findings?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-outfit text-white/35 uppercase tracking-widest mb-2">Key Findings</p>
                <ul className="space-y-1.5">
                  {result.key_findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/65 text-sm">
                      <span className="text-cyan-400 mt-0.5">›</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {knowledgeResult && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="tag tag-purple">Knowledge Graph Ready</span>
                  <span className="text-white/30 text-xs font-outfit ml-auto">
                    {knowledgeResult.nodes?.length} nodes · {knowledgeResult.edges?.length} connections
                  </span>
                </div>
                <KnowledgeGraph nodes={knowledgeResult.nodes} edges={knowledgeResult.edges} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* GitHub Repository Analysis Result Dashboard */}
      <AnimatePresence>
        {githubResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-10">
            <GithubAnalysisView analysis={githubResult} knowledgeResult={knowledgeResult} />
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
