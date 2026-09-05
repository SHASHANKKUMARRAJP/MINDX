import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const MODULE_SHOWCASE = [
  {
    id: 'reality',
    path: '/reality',
    title: 'Reality Scanner',
    subtitle: 'Vision Engine & AR Spatial Detection',
    badge: 'Vision Engine',
    badgeColor: '#00d4ff',
    icon: '◎',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    desc: 'Scan physical objects, analyze 3D scene spatial geometry, and generate high-precision bounding overlays with native vision detection.',
    features: [
      '1:1 Spatial Bounding Box Alignment',
      'Multi-Object Detection & Tagging',
      'Scene Context & Object Explanations',
      'Dual-Lens Zoom Crop Inspection'
    ]
  },
  {
    id: 'builder',
    path: '/builder',
    title: 'AI Web Application Builder',
    subtitle: 'Prompt to App & GitHub Repository Cloner',
    badge: 'Code Engine',
    badgeColor: '#ec4899',
    icon: '◈',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    desc: 'Transform raw text ideas or public GitHub URLs into live working single-page web applications rendered in interactive sandboxed iframes.',
    features: [
      '3-Mode Generator (Prompt, Discover, GitHub)',
      'Live Interactive Iframe Sandbox',
      'Full Source Code Tab with Copy & Download',
      'AI Repository Q&A & Refinement Chat'
    ]
  },
  {
    id: 'brain',
    path: '/notebook',
    title: 'Second Brain & Knowledge Graph',
    subtitle: 'Interactive 3D Galaxy Concept Graph',
    badge: 'Graph Engine',
    badgeColor: '#a78bfa',
    icon: '⬡',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    desc: 'Upload multi-document sources to synthesize deep context, extract core concepts, and visualize inter-node relationships in a 3D galaxy view.',
    features: [
      'Multi-File Source Context Ingestion',
      'Interactive 3D Galaxy Node Visualization',
      'Concept Deep Dive & Action Generator',
      'Context-Aware AI Assistant Chat'
    ]
  },
  {
    id: 'verify',
    path: '/verify',
    title: 'Content Verifier',
    subtitle: 'Truth Engine & Fact Consistency Checker',
    badge: 'Truth Engine',
    badgeColor: '#10b981',
    icon: '◉',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    desc: 'Cross-examine media integrity, evaluate visual & text claims against web ground truth, and calculate overall credibility confidence scores.',
    features: [
      'Multi-Pass Deepfake Detection',
      'Web-Linked Fact Verification',
      'Granular Credibility Score Gauges',
      'Contextual Discrepancy Breakdown'
    ]
  }
]

const STATS = [
  { label: 'Multimodal Engines', value: '4 Core' },
  { label: 'Latency Speed', value: '< 2.5s' },
  { label: 'Supported Inputs', value: 'Image / Code / Repo / Text' },
  { label: 'Live Sandbox', value: '100% Standalone' }
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('reality')

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 font-inter">
      {/* ── HERO SECTION ── */}
      <div className="text-center max-w-4xl mx-auto mb-16 pt-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass px-5 py-2 rounded-full mb-6 border border-cyan-500/30"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-outfit font-semibold tracking-wide bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Multimodal Intelligence & Digital Experience
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-outfit font-900 text-6xl sm:text-7xl md:text-8xl tracking-tight leading-none mb-6"
        >
          <span className="text-gradient-full">MINDX NEXUS</span>
          <br />
          <span className="text-white/90 text-4xl sm:text-6xl md:text-7xl font-700">Give AI Anything.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/60 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed mb-10 font-outfit"
        >
          The next-generation multimodal workspace. Scan physical reality, clone &amp; generate web apps from GitHub, build 3D knowledge graphs, and verify truth with deep multimodal intelligence.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={() => navigate('/home')}
            className="btn-nexus px-8 py-4 text-lg font-outfit font-700 flex items-center gap-3 w-full sm:w-auto justify-center shadow-2xl shadow-cyan-500/20"
          >
            <span>✦ Launch Multimodal Workspace</span>
            <span>→</span>
          </button>
          <button
            onClick={() => navigate('/builder')}
            className="glass px-8 py-4 rounded-xl text-lg font-outfit font-600 text-white/80 hover:text-white border border-white/10 hover:border-purple-400/40 transition-all w-full sm:w-auto text-center"
          >
            <span>◈ Build App from GitHub</span>
          </button>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 glass rounded-2xl border border-white/10">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center p-2">
              <div className="font-outfit font-800 text-2xl sm:text-3xl text-gradient-cyan mb-1">{stat.value}</div>
              <div className="text-xs text-white/40 font-outfit uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTERACTIVE MODULE EXPLORER SECTION ── */}
      <div className="mb-24">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-xs font-outfit text-cyan-400 uppercase tracking-widest font-700 mb-2">
            Complete Workspace Modules
          </p>
          <h2 className="font-outfit font-800 text-3xl sm:text-5xl text-white/90">
            How MINDX Nexus Works
          </h2>
          <p className="text-white/40 text-sm sm:text-base mt-2">
            Select a module below to preview live capabilities and step into the workspace.
          </p>
        </div>

        {/* Module Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {MODULE_SHOWCASE.map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveTab(mod.id)}
              className={`px-5 py-3 rounded-xl font-outfit font-600 text-sm transition-all flex items-center gap-2 border ${
                activeTab === mod.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border-cyan-400/50 shadow-lg shadow-cyan-500/10 scale-105'
                  : 'glass text-white/50 hover:text-white/80 border-white/5'
              }`}
            >
              <span style={{ color: mod.badgeColor }}>{mod.icon}</span>
              <span>{mod.title}</span>
            </button>
          ))}
        </div>

        {/* Active Module Feature Showcase Card */}
        {MODULE_SHOWCASE.map(mod => {
          if (mod.id !== activeTab) return null
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass rounded-3xl p-8 border border-white/10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Content */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-outfit font-700 uppercase tracking-wider"
                  style={{ background: `${mod.badgeColor}20`, color: mod.badgeColor, border: `1px solid ${mod.badgeColor}40` }}>
                  <span>{mod.icon}</span>
                  <span>{mod.badge}</span>
                </div>

                <div>
                  <h3 className="font-outfit font-800 text-3xl sm:text-4xl text-white/95 mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-sm font-outfit text-cyan-300/80 mb-4">{mod.subtitle}</p>
                  <p className="text-white/60 text-base leading-relaxed font-inter">
                    {mod.desc}
                  </p>
                </div>

                {/* Features Checklist */}
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <p className="text-xs font-outfit uppercase tracking-widest text-white/40 font-600">Core Capabilities</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mod.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-white/80 font-inter">
                        <span style={{ color: mod.badgeColor }}>✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Module Button */}
                <div className="pt-4">
                  <button
                    onClick={() => navigate(mod.path)}
                    className="btn-nexus px-6 py-3.5 text-base font-outfit font-700 flex items-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${mod.badgeColor}, #00d4ff)` }}
                  >
                    <span>Open {mod.title} Workspace</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Right Real High-Res Photography Preview with UI Overlays */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/80 group h-[340px] sm:h-[400px]">
                  <img
                    src={mod.image}
                    alt={mod.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040810] via-black/40 to-transparent" />
                  
                  {/* Floating Glassmorphic UI Card Overlay */}
                  <div className="absolute inset-4 flex flex-col justify-between p-4 pointer-events-none">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                        <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: mod.badgeColor }} />
                        <span className="text-xs font-outfit text-white font-600">{mod.badge} Active</span>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-500/30">
                        HD REAL PREVIEW
                      </span>
                    </div>

                    <div className="glass p-4 rounded-xl border border-white/15 bg-black/70 backdrop-blur-md space-y-2 pointer-events-auto">
                      <div className="flex items-center justify-between text-xs font-outfit font-bold text-white">
                        <span>{mod.title}</span>
                        <span className="text-cyan-300">100% Live</span>
                      </div>
                      <p className="text-[11.5px] text-white/70 font-inter line-clamp-2">
                        {mod.desc}
                      </p>
                      <button
                        onClick={() => navigate(mod.path)}
                        className="w-full py-2 rounded-lg text-xs font-outfit font-bold text-white transition-all mt-1"
                        style={{ background: `linear-gradient(135deg, ${mod.badgeColor}, #00d4ff)` }}
                      >
                        Launch Interactive Workspace →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── ALL MODULE CARDS GRID SECTION ── */}
      <div className="mb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-outfit font-800 text-3xl sm:text-4xl text-white/90">
            Choose Your Destination
          </h2>
          <p className="text-white/40 text-sm mt-2">
            Jump directly into any of the 4 specialized multimodal workspaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MODULE_SHOWCASE.map(mod => (
            <motion.div
              key={mod.id}
              whileHover={{ y: -6 }}
              onClick={() => navigate(mod.path)}
              className="glass p-6 rounded-2xl border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer group text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `${mod.badgeColor}15`, border: `1px solid ${mod.badgeColor}30`, color: mod.badgeColor }}>
                    {mod.icon}
                  </div>
                  <span className="text-xs font-outfit font-700 px-3 py-1 rounded-full"
                    style={{ background: `${mod.badgeColor}15`, color: mod.badgeColor, border: `1px solid ${mod.badgeColor}30` }}>
                    {mod.badge}
                  </span>
                </div>
                <h3 className="font-outfit font-700 text-2xl text-white/90 mb-1 group-hover:text-cyan-300 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-white/50 text-sm font-inter leading-relaxed mb-4">
                  {mod.desc}
                </p>
              </div>

              <div className="relative rounded-xl overflow-hidden h-44 border border-white/10 mb-4 bg-black/60 group">
                <img
                  src={mod.image}
                  alt={mod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040810] via-black/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-outfit text-white font-600">
                  <span className="glass px-2.5 py-1 rounded-md bg-black/50 border-white/10" style={{ color: mod.badgeColor }}>
                    {mod.badge}
                  </span>
                  <span className="text-white/60 group-hover:text-white transition-colors">
                    Click to Open ↗
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-outfit font-600 pt-2 border-t border-white/5 text-white/40 group-hover:text-white/90 transition-colors">
                <span>Enter Workspace</span>
                <span>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── FOOTER CALLOUT ── */}
      <div className="glass rounded-3xl p-10 text-center border border-gradient relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="font-outfit font-900 text-3xl sm:text-4xl text-gradient-full">
            Ready to Build &amp; Analyze with MINDX?
          </h2>
          <p className="text-white/60 font-inter text-sm leading-relaxed">
            Experience the power of multimodal AI reasoning. Upload images, drop code, input GitHub URLs, or verify content instantly.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/home')}
              className="btn-nexus px-8 py-4 text-base font-outfit font-700 inline-flex items-center gap-2"
            >
              <span>✦ Get Started Now</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
