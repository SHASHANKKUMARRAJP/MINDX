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
  {
    icon: (
      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-2 mx-auto">
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    ),
    value: '4 Core',
    label: 'MULTIMODAL ENGINES'
  },
  {
    icon: (
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-2 mx-auto">
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    ),
    value: '< 60s',
    label: 'LATENCY SPEED'
  },
  {
    icon: (
      <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mb-2 mx-auto">
        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    ),
    value: 'Image / Code / Repo / Text',
    label: 'SUPPORTED INPUTS'
  },
  {
    icon: (
      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-2 mx-auto">
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
    ),
    value: '92% Standalone',
    label: 'LIVE SANDBOX'
  }
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('reality')

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 font-inter">
      {/* ── HERO SECTION (2-COLUMN SPLIT WITH GLOBL HOLOGRAPHIC ORBIT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16 pt-2">
        {/* Left Column: Text & Primary CTAs */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full border border-cyan-500/30"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-outfit font-semibold tracking-wide bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Multimodal Intelligence &amp; Digital Experience
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-outfit font-900 text-5xl sm:text-7xl lg:text-7xl tracking-tight leading-tight"
          >
            <span className="text-gradient-full">MINDX NEXUS</span>
            <br />
            <span className="text-white/95 text-3xl sm:text-5xl lg:text-6xl font-700">Give AI Anything.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/60 text-base sm:text-lg leading-relaxed font-outfit max-w-2xl"
          >
            The next-generation multimodal workspace. Scan physical reality, clone &amp; generate web apps from GitHub, build 3D knowledge graphs, and verify truth with deep multimodal intelligence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-2"
          >
            <button
              onClick={() => navigate('/home')}
              aria-label="Launch Multimodal Workspace"
              className="btn-nexus px-7 py-3.5 text-base font-outfit font-700 flex items-center gap-2.5 w-full sm:w-auto justify-center shadow-xl shadow-cyan-500/20"
            >
              <span>🚀 Launch Multimodal Workspace</span>
              <span>→</span>
            </button>
            <button
              onClick={() => navigate('/builder')}
              aria-label="Build App from GitHub Repository"
              className="glass px-7 py-3.5 rounded-xl text-base font-outfit font-600 text-white/80 hover:text-white border border-white/10 hover:border-purple-400/40 transition-all w-full sm:w-auto text-center flex items-center gap-2 justify-center"
            >
              <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Build App from GitHub</span>
            </button>
          </motion.div>
        </div>

        {/* Right Column: 3D Holographic Globe with Orbiting Badges */}
        <div className="lg:col-span-5 relative">
          <div className="relative w-full h-[340px] sm:h-[400px] flex items-center justify-center">
            {/* Concentric rotating orbit rings */}
            <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-500/20 animate-spin-slow" style={{ animationDuration: '35s' }} />
            <div className="absolute w-[240px] h-[240px] rounded-full border border-purple-500/30 animate-spin-slow" style={{ animationDuration: '22s', animationDirection: 'reverse' }} />
            <div className="absolute w-[180px] h-[180px] rounded-full border border-pink-500/20" />

            {/* Central Holographic Sphere */}
            <div className="relative w-[160px] h-[160px] rounded-full bg-gradient-to-br from-cyan-500/25 via-purple-600/35 to-pink-500/25 border border-cyan-400/50 shadow-[0_0_90px_rgba(0,212,255,0.3)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.2)_0,transparent_70%)]" />
              <svg className="w-full h-full opacity-50 text-cyan-300" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 2" />
                <ellipse cx="50" cy="50" rx="45" ry="18" fill="none" stroke="currentColor" strokeWidth="0.6" />
                <ellipse cx="50" cy="50" rx="18" ry="45" fill="none" stroke="currentColor" strokeWidth="0.6" />
                <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.6" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.6" />
              </svg>
            </div>

            {/* Pinned Orbital Badges (as seen in photo) */}
            {/* Top Right: Scan */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[12%] right-[8%] glass px-3.5 py-1.5 rounded-full border border-cyan-400/40 text-xs font-outfit font-semibold text-cyan-300 flex items-center gap-1.5 bg-black/70 shadow-lg shadow-cyan-500/20 backdrop-blur-md"
            >
              <span className="text-[10px]">◇</span>
              <span>Scan</span>
            </motion.div>

            {/* Middle Left: Understand */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute top-[32%] left-[2%] glass px-3.5 py-1.5 rounded-full border border-cyan-400/40 text-xs font-outfit font-semibold text-cyan-300 flex items-center gap-1.5 bg-black/70 shadow-lg shadow-cyan-500/20 backdrop-blur-md"
            >
              <span className="text-[10px]">✦</span>
              <span>Understand</span>
            </motion.div>

            {/* Middle Right: Build */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-[48%] right-[6%] glass px-3.5 py-1.5 rounded-full border border-purple-400/40 text-xs font-outfit font-semibold text-purple-300 flex items-center gap-1.5 bg-black/70 shadow-lg shadow-purple-500/20 backdrop-blur-md"
            >
              <span className="text-[10px]">◈</span>
              <span>Build</span>
            </motion.div>

            {/* Bottom Right: Verify */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              className="absolute bottom-[16%] right-[24%] glass px-3.5 py-1.5 rounded-full border border-pink-400/40 text-xs font-outfit font-semibold text-pink-300 flex items-center gap-1.5 bg-black/70 shadow-lg shadow-pink-500/20 backdrop-blur-md"
            >
              <span className="text-[10px]">✦</span>
              <span>Verify</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ROW (4 GLASS CARDS WITH TOP ICONS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-5 glass rounded-2xl border border-white/10 mb-16 items-center">
        {STATS.map((stat, i) => (
          <div key={i} className="glass p-4 rounded-xl border border-white/10 text-center hover:border-cyan-500/30 transition-all group">
            {stat.icon}
            <div className="font-outfit font-800 text-xl sm:text-2xl text-gradient-cyan mb-1 group-hover:scale-105 transition-transform">{stat.value}</div>
            <div className="text-[11px] text-white/40 font-outfit font-600 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
        {/* 5th Column Note */}
        <div className="col-span-2 lg:col-span-1 text-center lg:text-left p-3">
          <p className="font-outfit font-700 text-sm text-white/80 leading-snug">
            One Workspace
          </p>
          <p className="font-outfit text-xs text-cyan-400 font-500">
            Infinite Possibilities
          </p>
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
