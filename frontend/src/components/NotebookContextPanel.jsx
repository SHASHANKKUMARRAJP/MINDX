import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NODE_COLORS = {
  concept:    '#00d4ff',
  entity:     '#7c3aed',
  topic:      '#3b82f6',
  dependency: '#8b5cf6',
  fact:       '#10b981',
  gap:        '#f59e0b',
}

const AI_ACTIONS = [
  { id: 'explain',    label: 'Explain',          icon: '💡', desc: 'Clear explanation from sources' },
  { id: 'deep_dive',  label: 'Deep Dive',         icon: '🔬', desc: 'Thorough technical analysis' },
  { id: 'connections',label: 'Connections',       icon: '🔗', desc: 'How it links to other concepts' },
  { id: 'example',    label: 'Example',           icon: '⚡', desc: 'Practical example from context' },
  { id: 'quiz',       label: 'Quiz Me',           icon: '🎯', desc: 'Test questions from sources' },
  { id: 'missing',    label: 'What Am I Missing?',icon: '🕵️', desc: 'Gaps and contradictions' },
  { id: 'summarize',  label: 'Summarize',         icon: '📋', desc: 'Concise structured summary' },
]

function SourceChip({ name }) {
  const ext = (name || '').split('.').pop().toLowerCase()
  const icons = { pdf: '📕', md: '📝', txt: '📄', py: '💻', js: '💻', ts: '💻', png: '🖼️', jpg: '🖼️' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99, fontSize: 11,
      background: 'rgba(0,212,255,0.1)', color: 'rgba(0,212,255,0.8)',
      border: '1px solid rgba(0,212,255,0.2)',
      fontFamily: 'Outfit, sans-serif',
    }}>
      {icons[ext] || '📄'} {name}
    </span>
  )
}

function AIResponsePanel({ response, loading }) {
  return (
    <div style={{
      background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)',
      borderRadius: 12, padding: 14, marginTop: 12,
    }}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: 'rgba(0,212,255,0.7)', fontSize: 12, fontFamily: 'Outfit' }}>MINDX is thinking…</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#00d4ff',
                  animation: `typing 1.2s ease-in-out ${i * 0.2}s infinite`,
                  display: 'inline-block',
                }} />
              ))}
            </div>
          </div>
          {[80, 60, 90, 50].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 6 }} />
          ))}
        </div>
      ) : response ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontFamily: 'Outfit', fontWeight: 600,
              color: 'rgba(0,212,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              ✦ {response.action?.replace(/_/g, ' ')} · {response.concept}
            </span>
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.7,
            fontFamily: 'Inter, sans-serif', whiteSpace: 'pre-wrap',
          }}>
            {response.response}
          </p>
          {response.sources_used?.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit', alignSelf: 'center' }}>Sources:</span>
              {response.sources_used.map(s => <SourceChip key={s} name={s} />)}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default function NotebookContextPanel({ node, onAction, aiResponse, aiLoading, onAskAbout }) {
  const [activeAction, setActiveAction] = useState(null)

  if (!node) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.25)', textAlign: 'center', gap: 12, padding: 24,
      }}>
        <div style={{ fontSize: 40, opacity: 0.3 }}>◎</div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14 }}>
          Click any node on the graph to explore it
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', fontFamily: 'Inter' }}>
          AI actions, explanations, and source citations will appear here
        </p>
      </div>
    )
  }

  const color = NODE_COLORS[node.type] || '#00d4ff'

  const handleAction = (actionId) => {
    setActiveAction(actionId)
    onAction(actionId, node)
  }

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Node header */}
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {/* Color dot */}
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: color,
            boxShadow: `0 0 8px ${color}80`, flexShrink: 0,
          }} />
          {/* Type badge */}
          <span style={{
            padding: '1px 8px', borderRadius: 99, fontSize: 10,
            background: `${color}18`, color, border: `1px solid ${color}35`,
            fontFamily: 'Outfit, sans-serif', fontWeight: 600, textTransform: 'capitalize',
          }}>
            {node.type}
          </span>
        </div>

        <h3 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16,
          color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, marginBottom: 8,
        }}>
          {node.title}
        </h3>

        {node.description && (
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.55)',
            fontFamily: 'Inter, sans-serif', lineHeight: 1.6,
          }}>
            {node.description}
          </p>
        )}

        {/* Source refs */}
        {node.sources?.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {node.sources.slice(0, 3).map(s => <SourceChip key={s} name={s} />)}
            {node.sources.length > 3 && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>
                +{node.sources.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {/* AI Actions grid */}
        <p style={{
          fontSize: 10, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 10,
        }}>
          AI Actions
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 4 }}>
          {AI_ACTIONS.map(({ id, label, icon }) => {
            const isActive = activeAction === id && aiLoading
            const isLast = id === 'missing' || id === 'summarize'
            return (
              <button
                key={id}
                onClick={() => handleAction(id)}
                disabled={aiLoading}
                title={AI_ACTIONS.find(a => a.id === id)?.desc}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 10px', borderRadius: 9, cursor: aiLoading ? 'not-allowed' : 'pointer',
                  background: isActive ? `${color}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                  color: isActive ? color : 'rgba(255,255,255,0.65)',
                  fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 12,
                  transition: 'all 0.2s ease',
                  gridColumn: id === 'missing' ? 'span 2' : 'auto',
                  opacity: aiLoading && !isActive ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (!aiLoading) {
                    e.currentTarget.style.background = `${color}12`
                    e.currentTarget.style.borderColor = `${color}35`
                    e.currentTarget.style.color = color
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                  }
                }}
              >
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span>{label}</span>
                {isActive && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 4, height: 4, borderRadius: '50%', background: color,
                        animation: `typing 1.2s ease-in-out ${i * 0.2}s infinite`,
                        display: 'inline-block',
                      }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* AI Response */}
        <AnimatePresence>
          {(aiLoading || aiResponse) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AIResponsePanel response={aiResponse} loading={aiLoading} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Related concepts */}
        {node.related_concepts?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{
              fontSize: 10, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 8,
            }}>
              Related Concepts
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {node.related_concepts.slice(0, 6).map(rc => (
                <span key={rc} style={{
                  padding: '2px 9px', borderRadius: 99, fontSize: 11,
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'Outfit, sans-serif',
                }}>
                  {rc.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ask about this shortcut */}
        {onAskAbout && (
          <button
            onClick={() => onAskAbout(`Tell me more about "${node.title}" based on the notebook sources.`)}
            style={{
              marginTop: 16, width: '100%', padding: '9px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,212,255,0.06)'
              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'
              e.currentTarget.style.color = 'rgba(0,212,255,0.7)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
            }}
          >
            💬 Ask about this in chat
          </button>
        )}
      </div>
    </motion.div>
  )
}
