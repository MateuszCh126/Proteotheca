/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--bg-base) / <alpha-value>)',
        panel: 'hsl(var(--bg-panel) / <alpha-value>)',
        accent: {
          cyan: 'hsl(var(--accent-cyan) / <alpha-value>)',
          blue: 'hsl(var(--accent-blue) / <alpha-value>)',
          violet: 'hsl(var(--accent-violet) / <alpha-value>)',
          warning: 'hsl(var(--accent-warning) / <alpha-value>)',
          success: 'hsl(var(--accent-success) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Inter', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'accent-cyan': '0 0 15px rgba(23, 222, 222, 0.2)',
        'accent-blue': '0 0 15px rgba(60, 108, 244, 0.2)',
        'accent-violet': '0 0 15px rgba(163, 60, 244, 0.2)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, boxShadow: '0 0 10px rgba(23, 222, 222, 0.1)' },
          '50%': { opacity: 1, boxShadow: '0 0 20px rgba(23, 222, 222, 0.4)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
