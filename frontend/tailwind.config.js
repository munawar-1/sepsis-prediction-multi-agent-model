/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    // Disable preflight so Tailwind does not override landing page styles
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter Tight"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'card': '0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02)',
        'modal': '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.03)',
      },
      borderRadius: {
        'card': '16px',
        'pill': '9999px',
        'input': '12px',
      },
      colors: {
        // High-end SaaS Warm Canvas & Surfaces
        canvas: {
          warm: '#F9FAFB', // warm light neutral canvas
          pure: '#FFFFFF', // pure white card surface
          subtle: '#F3F4F6', // hover/secondary fill
        },
        border: {
          subtle: '#E5E7EB', // 1px subtle divider
          light: '#F3F4F6',
          focus: '#10B981',
        },
        // Refined Text Hierarchy
        text: {
          charcoal: '#111827', // primary headers
          slate: '#4B5563',    // secondary body
          caption: '#9CA3AF',  // muted captions
        },
        // Modern Brand Accents
        brand: {
          DEFAULT: '#10B981',
          hover: '#059669',
          tint: '#ECFDF5',
          border: '#D1FAE5',
          indigo: '#4F46E5',
          'indigo-tint': '#EEF2FF',
        },
        // Refined Clinical Status Indicators
        status: {
          critical: {
            bg: '#FEF2F2',
            border: '#FEE2E2',
            text: '#DC2626',
          },
          warning: {
            bg: '#FFFBEB',
            border: '#FEF3C7',
            text: '#D97706',
          },
          normal: {
            bg: '#ECFDF5',
            border: '#D1FAE5',
            text: '#059669',
          },
          info: {
            bg: '#EFF6FF',
            border: '#DBEAFE',
            text: '#2563EB',
          }
        },
        navy: {
          950: '#070A0F',
          900: '#0D121D',
          850: '#131B2A',
          800: '#1A2438',
          750: '#1B263B',
          700: '#1F293D',
          600: '#2F3E5C',
        },
        clinical: {
          teal: '#10B981',
          'teal-dim': 'rgba(16, 185, 129, 0.12)',
          amber: '#F59E0B',
          'amber-dim': 'rgba(245, 158, 11, 0.12)',
          rose: '#DC2626',
          'rose-dim': 'rgba(220, 38, 38, 0.12)',
          cyan: '#0EA5E9',
          'cyan-dim': 'rgba(14, 165, 233, 0.12)',
          slate: '#9CA3AF',
          muted: '#6B7280',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
