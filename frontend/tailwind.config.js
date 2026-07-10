/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper:   'hsl(var(--paper) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        wash:    'hsl(var(--wash) / <alpha-value>)',
        line:    'hsl(var(--line) / <alpha-value>)',
        ink: {
          DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
          2: 'hsl(var(--ink-2) / <alpha-value>)',
          3: 'hsl(var(--ink-3) / <alpha-value>)',
        },
        path:   'hsl(var(--path) / <alpha-value>)',
        benign: 'hsl(var(--benign) / <alpha-value>)',
        plddt: {
          1: 'hsl(var(--plddt-1) / <alpha-value>)',
          2: 'hsl(var(--plddt-2) / <alpha-value>)',
          3: 'hsl(var(--plddt-3) / <alpha-value>)',
          4: 'hsl(var(--plddt-4) / <alpha-value>)',
        },
        /* legacy aliases (repointed via CSS vars) so un-swept components stay coherent */
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
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Libre Franklin', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '4xs': ['0.5625rem', { lineHeight: '0.75rem', letterSpacing: '0.04em' }],
        '3xs': ['0.625rem',  { lineHeight: '0.85rem', letterSpacing: '0.03em' }],
        '2xs': ['0.6875rem', { lineHeight: '0.95rem' }],
      },
      boxShadow: {
        'glass-glow': '0 1px 2px hsl(222 20% 10% / 0.03), 0 6px 24px hsl(222 20% 10% / 0.05)',
        'accent-cyan': '0 1px 2px hsl(222 20% 10% / 0.04)',
        'accent-blue': '0 1px 2px hsl(222 20% 10% / 0.04)',
        'accent-violet': '0 1px 2px hsl(222 20% 10% / 0.04)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'rise': 'rise 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        rise: {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
