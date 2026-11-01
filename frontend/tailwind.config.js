/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    // Disable preflight so Tailwind does not override or reset landing page styles
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter Tight"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        navy: {
          950: '#070A0F', // deep midnight navy base
          900: '#0D121D', // charcoal elevated surface
          850: '#131B2A', // card/panel surface
          800: '#1A2438', // component surface
          750: '#1B263B',
          700: '#1F293D', // crisp fine border
          600: '#2F3E5C',
        },
        clinical: {
          teal: '#14B8A6',
          'teal-dim': 'rgba(20, 184, 166, 0.12)',
          amber: '#F59E0B',
          'amber-dim': 'rgba(245, 158, 11, 0.12)',
          rose: '#EF4444',
          'rose-dim': 'rgba(239, 68, 68, 0.12)',
          cyan: '#0EA5E9',
          'cyan-dim': 'rgba(14, 165, 233, 0.12)',
          slate: '#94A3B8',
          muted: '#64748B',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

