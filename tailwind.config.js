/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0D12',
        glassCard: '#12151E',
        amberGold: '#E5A93C',
        amberBright: '#F59E0B',
        cinexus: {
          950: '#0B0D12', // Obsidian Dark
          900: '#0e1117',
          850: '#12151E', // Glassmorphism Card base
          800: '#171c26',
          700: '#232b3a',
          600: '#344158',
          500: '#4b5d7d',
          accent: '#E5A93C', // Warm Amber Gold
          amber: '#F59E0B',  // Vivid Amber
          gold: '#E5A93C',
          cyan: '#38bdf8',
          neon: '#818cf8'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Cinzel', 'Plus Jakarta Sans', 'sans-serif'],
        cinema: ['Cinzel', 'serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(229, 169, 60, 0.35)' },
          '100%': { boxShadow: '0 0 35px rgba(229, 169, 60, 0.75)' },
        }
      }
    },
  },
  plugins: [],
}
