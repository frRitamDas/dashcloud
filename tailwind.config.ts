import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05060a',
          900: '#080a11',
          850: '#0b0e17',
          800: '#10141f',
          750: '#141a28',
          700: '#1b2233',
          600: '#26304a',
        },
        brand: {
          50: '#eef0ff',
          100: '#dfe2ff',
          200: '#c3c8ff',
          300: '#9ba3ff',
          400: '#7c83ff',
          500: '#6d5cff',
          600: '#5a3df0',
          700: '#4a2ed0',
          800: '#3a24a3',
          900: '#2b1b75',
        },
        neon: {
          cyan: '#22d3ee',
          mint: '#4ade80',
          amber: '#fbbf24',
          rose: '#fb7185',
          violet: '#a78bfa',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        lift: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 40px -22px rgba(0,0,0,0.9)',
        card: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 12px 32px -18px rgba(0,0,0,0.85)',
        glow: '0 0 0 1px rgba(109,92,255,0.35), 0 18px 60px -20px rgba(109,92,255,0.55)',
      },
      borderRadius: { xl2: '1.375rem' },
      keyframes: {
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        'shimmer': { '100%': { transform: 'translateX(100%)' } },
        'float-slow': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
