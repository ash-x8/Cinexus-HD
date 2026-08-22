/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinexus: {
          950: '#07090e',
          900: '#0c1017',
          850: '#111722',
          800: '#17202e',
          700: '#233044',
          600: '#33445f',
          500: '#486288',
          accent: '#e50914',
          gold: '#f5c518',
          cyan: '#00e5ff',
          neon: '#6366f1'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(229, 9, 20, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(229, 9, 20, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
