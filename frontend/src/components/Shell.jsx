import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const NAV = [
  { to: '/', label: 'Overview', icon: '✦' },
  { to: '/home', label: 'Workspace', icon: '⬡' },
  { to: '/reality', label: 'Reality', icon: '◎' },
  { to: '/builder', label: 'Builder', icon: '◈' },
  { to: '/verify', label: 'Verify', icon: '◉' },
]

export default function Shell({ children }) {
  return (
    <div className="relative z-10 min-h-screen flex flex-col w-full max-w-full overflow-x-clip">
      {/* Skip to Content for Screen Readers / Accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-cyan-400 focus:text-black focus:font-bold focus:rounded-lg">
        Skip to main content
      </a>

      {/* Header - Flush Edge-to-Edge with Safe Area Insets for Mobile Notches */}
      <header className="sticky top-0 z-40 bg-[#050a12]/92 backdrop-blur-2xl border-b border-white/[0.08] w-full safe-pt" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
          {/* Logo */}
          <NavLink to="/" aria-label="MINDX Nexus Homepage" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-xs sm:text-sm font-bold glow-cyan shadow-lg shadow-cyan-500/20" aria-hidden="true">
              ✦
            </div>
            <span className="font-outfit font-bold text-base sm:text-lg tracking-tight">
              <span className="text-gradient-cyan">MINDX</span>
              <span className="text-white/90"> Nexus</span>
            </span>
          </NavLink>

          {/* Desktop Nav links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                aria-label={`Navigate to ${label}`}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-1.5 ${isActive ? 'active' : ''}`
                }
              >
                <span className="opacity-60 text-xs" aria-hidden="true">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Status badge - Responsive */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] flex-shrink-0" aria-label="System status: Online">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span className="text-[11px] sm:text-xs font-outfit font-semibold tracking-wide bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              <span className="hidden md:inline">Multimodal Intelligence &amp; Digital Experience</span>
              <span className="hidden sm:inline md:hidden">AI Nexus Online</span>
              <span className="sm:hidden font-mono font-bold tracking-wider">LIVE</span>
            </span>
          </div>
        </div>
      </header>

      {/* Page content with bottom padding on mobile for the bottom nav bar */}
      <main id="main-content" tabIndex="-1" className="flex-1 relative outline-none w-full max-w-full pb-28 md:pb-6">
        {children}
      </main>

      {/* Mobile App-Style Bottom Navigation Bar (Docked, Thumb-Friendly) */}
      <nav aria-label="Mobile App Navigation" className="md:hidden mobile-nav-bar grid grid-cols-5 safe-pb px-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={label}
            className={({ isActive }) =>
              `mobile-nav-item transition-all ${isActive ? 'active text-cyan-300 font-semibold' : 'text-white/45 hover:text-white/70'}`
            }
          >
            <span className="text-base mb-0.5 leading-none" aria-hidden="true">{icon}</span>
            <span className="text-[10px] tracking-tight leading-tight">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/[0.04] pb-28 md:pb-6" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-xs text-white/25 font-outfit">
            MINDX Nexus · Powered by MINDX API
          </p>
          <p className="text-xs text-white/20 font-outfit">
            Built for Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  )
}

