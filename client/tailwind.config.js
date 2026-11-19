/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#05060c',
        navy: '#0a1024',
        ink: '#0d1220',
        electric: '#3b82f6',
        neon: '#a855f7',
        cyan: '#22d3ee',
        mint: '#34d399',
        fg: 'var(--fg)',
        muted: 'var(--fg-muted)',
        surface: 'var(--panel)',
        stroke: 'var(--stroke)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glass: '0 24px 80px -24px rgba(0,0,0,0.85), inset 0 1px 0 0 rgba(255,255,255,0.06)',
        glow: '0 0 40px -8px rgba(124,92,255,0.55)',
        dock: '0 18px 50px -12px rgba(0,0,0,0.9), inset 0 1px 0 0 rgba(255,255,255,0.10)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 50% 0%, rgba(124,92,255,0.18), transparent 55%)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
        scan: 'scan 3s linear infinite',
      },
    },
  },
  plugins: [],
}
