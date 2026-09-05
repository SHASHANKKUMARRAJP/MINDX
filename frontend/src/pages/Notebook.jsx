import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { buildNotebook, notebookAction, notebookChat } from '../services/api'
import NotebookGraph from '../components/NotebookGraph'
import NotebookContextPanel from '../components/NotebookContextPanel'

const FILE_ICON = name => {
  const ext = (name || '').split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️'
  if (ext === 'pdf') return '📕'
  if (['md', 'markdown', 'rst'].includes(ext)) return '📝'
  if (['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'go', 'rs'].includes(ext)) return '💻'
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return '⚙️'
  return '📄'
}

const FILE_TYPE_COLORS = {
  pdf: '#ef4444', md: '#a78bfa', markdown: '#a78bfa', txt: '#60a5fa',
  py: '#34d399', js: '#fbbf24', ts: '#3b82f6', jsx: '#60a5fa',
  tsx: '#60a5fa', png: '#f472b6', jpg: '#f472b6', jpeg: '#f472b6',
}

// Build a combined source context string from file objects + their extracted text
function buildSourceContext(sources) {
  return sources.map(s =>
    `SOURCE: ${s.name}\n${s.preview || '[content uploaded]'}`
  ).join('\n\n---\n\n')
}

function SourceCard({ file, onRemove, isActive }) {
  const ext = (file.name || '').split('.').pop().toLowerCase()
  const color = FILE_TYPE_COLORS[ext] || '#60a5fa'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 10, cursor: 'default', position: 'relative',
        background: isActive ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isActive ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>
        {FILE_ICON(file.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: 'rgba(255,255,255,0.85)', fontSize: 12,
          fontFamily: 'Outfit, sans-serif', fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {file.name}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Inter' }}>
          {(file.size / 1024).toFixed(1)} KB · .{ext}
        </p>
      </div>
      <button
        onClick={() => onRemove(file.name)}
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
          cursor: 'pointer', fontSize: 16, padding: 2, lineHeight: 1,
          opacity: 0, transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0}
        onFocus={e => e.currentTarget.style.opacity = 1}
        onBlur={e => e.currentTarget.style.opacity = 0}
        title="Remove file"
      >
        ×
      </button>
    </motion.div>
  )
}

function ChatMessage({ msg }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
      }}
    >
      <div style={{
        maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
        background: msg.role === 'user'
          ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))'
          : 'rgba(255,255,255,0.05)',
        border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
        color: 'rgba(255,255,255,0.85)', fontSize: 13,
        fontFamily: 'Inter, sans-serif', lineHeight: 1.65,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
      {msg.sources?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: '85%', paddingLeft: 4 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit', alignSelf: 'center' }}>From:</span>
          {msg.sources.map(s => (
            <span key={s} style={{
              padding: '1px 7px', borderRadius: 99, fontSize: 10,
              background: 'rgba(0,212,255,0.1)', color: 'rgba(0,212,255,0.7)',
              border: '1px solid rgba(0,212,255,0.18)', fontFamily: 'Outfit',
            }}>
              {s}
            </span>
          ))}
        </div>
      )}
      {msg.followups?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: '100%' }}>
          {msg.followups.map((q, i) => (
            <button
              key={i}
              onClick={() => msg.onFollowup?.(q)}
              style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 11,
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                fontFamily: 'Outfit', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,212,255,0.08)'
                e.currentTarget.style.color = 'rgba(0,212,255,0.7)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function Notebook() {
  // Sources
  const [sources, setSources] = useState([])
  // Graph data
  const [graphData, setGraphData] = useState(null)
  const [summary, setSummary] = useState('')
  const [keyThemes, setKeyThemes] = useState([])
  // Selected node
  const [selectedNode, setSelectedNode] = useState(null)
  // AI Panel
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  // Chat
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatExpanded, setChatExpanded] = useState(false)
  // Build state
  const [building, setBuilding] = useState(false)
  const [buildError, setBuildError] = useState(null)

  const chatEndRef = useRef(null)
  const chatInputRef = useRef(null)

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const onDrop = useCallback(accepted => {
    setSources(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...accepted.filter(f => !existing.has(f.name))]
    })
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

  const removeSource = name => {
    setSources(prev => prev.filter(f => f.name !== name))
    if (selectedNode?.sources?.includes(name)) setSelectedNode(null)
  }

  const handleBuild = async () => {
    if (!sources.length) return
    setBuilding(true)
    setBuildError(null)
    setGraphData(null)
    setSelectedNode(null)
    setAiResponse(null)
    setChatMessages([])

    try {
      const data = await buildNotebook(sources)
      setGraphData({ nodes: data.nodes || [], edges: data.edges || [] })
      setSummary(data.summary || '')
      setKeyThemes(data.key_themes || [])
    } catch (err) {
      setBuildError(err.response?.data?.detail || 'Failed to build notebook. Please try again.')
    } finally {
      setBuilding(false)
    }
  }

  const handleNodeSelect = node => {
    setSelectedNode(node)
    setAiResponse(null)
    setChatExpanded(false)
  }

  const handleAIAction = async (action, node) => {
    setAiLoading(true)
    setAiResponse(null)
    const ctx = buildSourceContext(sources)
    try {
      const result = await notebookAction(
        action,
        node.title,
        node.description || '',
        ctx
      )
      setAiResponse(result)
    } catch (err) {
      setAiResponse({
        action,
        concept: node.title,
        response: '⚠ Failed to get AI response: ' + (err.response?.data?.detail || err.message),
        sources_used: [],
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleChat = async (messageOverride) => {
    const msg = messageOverride || chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatExpanded(true)
    const userMsg = { role: 'user', content: msg }
    setChatMessages(prev => [...prev, userMsg])
    setChatLoading(true)

    const ctx = buildSourceContext(sources)
    try {
      const result = await notebookChat(msg, ctx)
      const followups = result.follow_up_questions || []
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: result.answer,
        sources: result.sources_used || [],
        followups,
        onFollowup: (q) => handleChat(q),
      }])
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠ Failed to get a response: ' + (err.response?.data?.detail || err.message),
        sources: [],
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleChatKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChat()
    }
  }

  const hasGraph = graphData && graphData.nodes.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        height: 'calc(100vh - 70px)', overflow: 'hidden',
      }}
    >
      {/* ─── Top bar ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        background: 'rgba(5,10,18,0.6)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))',
            border: '1px solid rgba(0,212,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>
            ⬡
          </div>
          <div>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17,
              background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}>
              Nexus Notebook
            </h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter' }}>
              Upload sources · Map knowledge · Explore with AI
            </p>
          </div>
        </div>

        {hasGraph && (
          <div style={{ marginLeft: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 11,
              background: 'rgba(16,185,129,0.12)', color: '#34d399',
              border: '1px solid rgba(16,185,129,0.25)', fontFamily: 'Outfit',
            }}>
              ✓ {graphData.nodes.length} concepts mapped
            </span>
            {keyThemes.slice(0, 3).map(t => (
              <span key={t} style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 11,
                background: 'rgba(124,58,237,0.1)', color: '#a78bfa',
                border: '1px solid rgba(124,58,237,0.2)', fontFamily: 'Outfit',
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasGraph && (
            <button
              onClick={() => { setGraphData(null); setSelectedNode(null); setAiResponse(null); setChatMessages([]) }}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit', cursor: 'pointer',
              }}
            >
              ↺ Reset
            </button>
          )}
          <button
            onClick={handleBuild}
            disabled={!sources.length || building}
            style={{
              padding: '7px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: sources.length && !building
                ? 'linear-gradient(135deg, #00d4ff, #7c3aed)'
                : 'rgba(255,255,255,0.07)',
              border: 'none', color: sources.length && !building ? 'white' : 'rgba(255,255,255,0.3)',
              fontFamily: 'Outfit', cursor: sources.length && !building ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.25s ease',
              boxShadow: sources.length && !building ? '0 4px 20px rgba(0,212,255,0.2)' : 'none',
            }}
          >
            {building ? (
              <>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 5, height: 5, borderRadius: '50%', background: 'white',
                      animation: `typing 1.2s ease-in-out ${i * 0.2}s infinite`,
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
                <span>Building…</span>
              </>
            ) : (
              <>✦ Build Notebook</>
            )}
          </button>
        </div>
      </div>

      {/* ─── Error Banner ────────────────────────────────────────── */}
      <AnimatePresence>
        {buildError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '10px 18px', flexShrink: 0,
              background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'Outfit' }}>⚠ {buildError}</p>
            <button
              onClick={() => setBuildError(null)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18 }}
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main workspace 3-panel layout ──────────────────────── */}
      <div className="notebook-workspace-grid" style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '240px 1fr 300px',
        gridTemplateRows: '1fr',
        overflow: 'hidden',
        minHeight: 0,
      }}>

        {/* ─ LEFT: Sources sidebar ─────────────────────────────── */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'rgba(5,10,18,0.4)',
        }}>
          {/* Dropzone */}
          <div
            {...getRootProps()}
            style={{
              margin: 12, padding: '14px 12px', borderRadius: 12, textAlign: 'center',
              border: `2px dashed ${isDragActive ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: isDragActive ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', transition: 'all 0.25s ease', flexShrink: 0,
            }}
          >
            <input {...getInputProps()} />
            <div style={{ fontSize: 22, opacity: 0.4, marginBottom: 4 }}>⊕</div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit' }}>
              {isDragActive ? 'Drop here →' : 'Add sources'}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter', marginTop: 2 }}>
              PDF · TXT · MD · Images · Code
            </p>
          </div>

          {/* Source label */}
          <div style={{
            padding: '4px 16px 8px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{
              fontSize: 10, fontFamily: 'Outfit', fontWeight: 600,
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Sources {sources.length > 0 && `(${sources.length})`}
            </p>
          </div>

          {/* Source list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
            {sources.length === 0 ? (
              <p style={{
                color: 'rgba(255,255,255,0.2)', fontSize: 12,
                fontFamily: 'Inter', textAlign: 'center', marginTop: 20,
              }}>
                No sources yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <AnimatePresence>
                  {sources.map(f => (
                    <SourceCard
                      key={f.name}
                      file={f}
                      onRemove={removeSource}
                      isActive={selectedNode?.sources?.includes(f.name)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Summary */}
          {summary && (
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
              <p style={{
                fontSize: 10, fontFamily: 'Outfit', fontWeight: 600,
                color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 6,
              }}>
                Overview
              </p>
              <p style={{
                fontSize: 11, color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Inter', lineHeight: 1.6,
              }}>
                {summary}
              </p>
            </div>
          )}
        </div>

        {/* ─ CENTER: Knowledge Graph canvas ────────────────────── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,212,255,0.03) 0%, transparent 70%)',
          display: 'flex', flexDirection: 'column',
        }}>
          {!hasGraph && !building ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40,
            }}>
              {/* Empty state with animated placeholder graph */}
              <div style={{ position: 'relative', width: 200, height: 160, opacity: 0.15 }}>
                {/* Decorative circles */}
                {[
                  { x: 100, y: 40, r: 18, c: '#00d4ff' },
                  { x: 40, y: 100, r: 14, c: '#7c3aed' },
                  { x: 160, y: 100, r: 14, c: '#10b981' },
                  { x: 100, y: 130, r: 12, c: '#f59e0b' },
                  { x: 60, y: 50, r: 10, c: '#3b82f6' },
                ].map((dot, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: dot.x - dot.r, top: dot.y - dot.r,
                    width: dot.r * 2, height: dot.r * 2, borderRadius: '50%',
                    background: dot.c,
                    boxShadow: `0 0 ${dot.r * 2}px ${dot.c}60`,
                    animation: `pulse ${1.5 + i * 0.3}s ease-in-out infinite alternate`,
                  }} />
                ))}
                {/* Lines between dots */}
                <svg style={{ position: 'absolute', inset: 0 }} width="200" height="160">
                  <line x1="100" y1="40" x2="40" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="100" y1="40" x2="160" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="100" x2="100" y2="130" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="160" y1="100" x2="100" y2="130" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="60" y1="50" x2="100" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                </svg>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700,
                  color: 'rgba(255,255,255,0.35)', marginBottom: 8,
                }}>
                  Your knowledge graph will appear here
                </p>
                <p style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter',
                  maxWidth: 340, lineHeight: 1.6,
                }}>
                  Add sources in the left panel, then click{' '}
                  <strong style={{ color: 'rgba(0,212,255,0.5)' }}>Build Notebook</strong>{' '}
                  to let MINDX map your knowledge.
                </p>
              </div>
            </div>
          ) : building ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
            }}>
              {/* Building animation */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #00d4ff, #7c3aed, #00d4ff)',
                animation: 'spin 1.5s linear infinite',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%', background: '#050a12',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  ⬡
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'Outfit', fontWeight: 700, fontSize: 16,
                  background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: 6,
                }}>
                  MINDX is mapping your knowledge…
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter' }}>
                  Extracting concepts, entities, and relationships from {sources.length} source{sources.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, position: 'relative' }}>
              <NotebookGraph
                nodes={graphData.nodes}
                edges={graphData.edges}
                selectedNode={selectedNode}
                onNodeSelect={handleNodeSelect}
              />
            </div>
          )}
        </div>

        {/* ─ RIGHT: AI Context Panel ───────────────────────────── */}
        <div style={{
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(5,10,18,0.4)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '10px 16px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{
              fontSize: 10, fontFamily: 'Outfit', fontWeight: 600,
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              AI Context
            </p>
            {selectedNode && (
              <button
                onClick={() => { setSelectedNode(null); setAiResponse(null) }}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: 16, lineHeight: 1,
                }}
                title="Close panel"
              >×</button>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <NotebookContextPanel
              node={selectedNode}
              onAction={handleAIAction}
              aiResponse={aiResponse}
              aiLoading={aiLoading}
              onAskAbout={(q) => {
                setChatInput(q)
                setChatExpanded(true)
                chatInputRef.current?.focus()
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── BOTTOM: Chat bar ────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,10,18,0.7)', backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
      }}>
        {/* Chat history — toggled */}
        <AnimatePresence>
          {chatExpanded && chatMessages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 220, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflowY: 'auto', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {chatMessages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingLeft: 4 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: '50%', background: 'rgba(0,212,255,0.6)',
                      animation: `typing 1.2s ease-in-out ${i * 0.2}s infinite`,
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
        }}>
          {/* Expand/collapse chat history toggle */}
          {chatMessages.length > 0 && (
            <button
              onClick={() => setChatExpanded(v => !v)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '6px 10px',
                color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Outfit',
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
              }}
              title={chatExpanded ? 'Hide chat history' : 'Show chat history'}
            >
              {chatExpanded ? '▾' : '▸'} {chatMessages.length / 2 | 0} msg
            </button>
          )}

          <input
            ref={chatInputRef}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={handleChatKeyDown}
            disabled={!hasGraph || chatLoading}
            placeholder={
              hasGraph
                ? 'Ask anything about your notebook sources… (Enter to send)'
                : 'Build a notebook first to start chatting…'
            }
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10, color: 'white', fontFamily: 'Inter',
              fontSize: 13, padding: '9px 14px', outline: 'none',
              transition: 'all 0.25s ease',
              opacity: hasGraph ? 1 : 0.5,
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'
              e.currentTarget.style.background = 'rgba(0,212,255,0.04)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            }}
          />

          <button
            onClick={() => handleChat()}
            disabled={!chatInput.trim() || chatLoading || !hasGraph}
            style={{
              padding: '9px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: chatInput.trim() && hasGraph && !chatLoading
                ? 'linear-gradient(135deg, #00d4ff, #7c3aed)'
                : 'rgba(255,255,255,0.07)',
              border: 'none',
              color: chatInput.trim() && hasGraph && !chatLoading ? 'white' : 'rgba(255,255,255,0.3)',
              cursor: chatInput.trim() && hasGraph && !chatLoading ? 'pointer' : 'not-allowed',
              flexShrink: 0, transition: 'all 0.2s',
            }}
          >
            ➤
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { from { opacity: 0.3; transform: scale(0.95); } to { opacity: 0.7; transform: scale(1.05); } }
      `}</style>
    </motion.div>
  )
}
