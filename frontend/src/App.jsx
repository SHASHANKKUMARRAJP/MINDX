import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Shell from './components/Shell'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import Reality from './pages/Reality'
import Builder from './pages/Builder'
import Verify from './pages/Verify'
import Notebook from './pages/Notebook'

export default function App() {
  return (
    <Router>
      {/* Animated background */}
      <div className="nexus-bg">
        <div className="nexus-grid" />
      </div>

      <Shell>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/reality" element={<Reality />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/notebook" element={<Notebook />} />
          </Routes>
        </AnimatePresence>
      </Shell>
    </Router>
  )
}
