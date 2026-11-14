/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern minimal zinc-based neutral palette
        Panel: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          border: '#E4E4E7', // zinc-200
          borderSubtle: '#F4F4F5', // zinc-100
          textPrimary: '#09090B', // zinc-950
          textSecondary: '#71717A', // zinc-500
          textMuted: '#A1A1AA', // zinc-400
          primary: '#18181B', // zinc-900
          primaryHover: '#27272A', // zinc-800
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 0 0 1px rgba(24, 24, 27, 0.06), 0 1px 2px -0.5px rgba(24, 24, 27, 0.04)',
        'elevated': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
