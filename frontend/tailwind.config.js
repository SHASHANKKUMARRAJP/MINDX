/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          primary: '#050a12',
          secondary: '#0a1628',
          tertiary: '#0f1e38',
        },
        accent: {
          cyan: '#00d4ff',
          purple: '#7c3aed',
          pink: '#ec4899',
          green: '#10b981',
          orange: '#f59e0b',
        },
        glass: {
          bg: 'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.08)',
          hover: 'rgba(255,255,255,0.07)',
        }
      },
      backgroundImage: {
        'gradient-nexus': 'linear-gradient(135deg, #050a12 0%, #0a1628 50%, #0f1e38 100%)',
        'gradient-cyan-purple': 'linear-gradient(135deg, #00d4ff, #7c3aed)',
        'gradient-pink-purple': 'linear-gradient(135deg, #ec4899, #7c3aed)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'grid-move': 'grid-move 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' },
          'to': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.7)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
