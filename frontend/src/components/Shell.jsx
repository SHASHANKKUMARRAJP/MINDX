import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const NAV = [
  { to: '/', label: 'Overview', icon: '✦' },
  { to: '/home', label: 'Workspace', icon: '⬡' },
  { to: '/notebook', label: 'Notebook', icon: '📘' },
  { to: '/reality', label: 'Reality', icon: '◎' },
  { to: '/builder', label: 'Builder', icon: '◈' },
  { to: '/verify', label: 'Verify', icon: '◉' },
]

export default function Shell({ children }) {
  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Skip to Content for Screen Readers / Accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-cyan-400 focus:text-black focus:font-bold focus:rounded-lg">
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/[0.06]" role="banner">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" aria-label="MINDX Nexus Homepage" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm font-bold glow-cyan" aria-hidden="true">
              ✦
            </div>
            <span className="font-outfit font-700 text-lg tracking-tight">
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

          {/* Status badge */}
          <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full" aria-label="System status: Online">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse-slow" style={{backgroundColor:'#10b981'}} aria-hidden="true" />
            <span className="text-xs font-outfit font-semibold tracking-wide bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Multimodal Intelligence &amp; Digital Experience
            </span>
          </div>
        </div>

        {/* Mobile nav */}
        <nav aria-label="Mobile Navigation" className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={`Navigate to ${label}`}
              className={({ isActive }) =>
                `nav-link flex items-center gap-1 whitespace-nowrap text-sm ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-xs" aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Page content */}
      <main id="main-content" tabIndex="-1" className="flex-1 relative outline-none">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/[0.04]" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
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
