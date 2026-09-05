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
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm font-bold glow-cyan">
              ✦
            </div>
            <span className="font-outfit font-700 text-lg tracking-tight">
              <span className="text-gradient-cyan">MINDX</span>
              <span className="text-white/90"> Nexus</span>
            </span>
          </NavLink>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-1.5 ${isActive ? 'active' : ''}`
                }
              >
                <span className="opacity-60 text-xs">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Status badge */}
          <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse-slow" style={{backgroundColor:'#10b981'}} />
            <span className="text-xs font-outfit font-semibold tracking-wide bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Multimodal Intelligence & Digital Experience
            </span>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link flex items-center gap-1 whitespace-nowrap text-sm ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-xs">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Page content */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/[0.04]">
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
