import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#07070c', 900: '#0b0b13', 800: '#12121d', 700: '#1b1b2b' },
        straw: {
          200: '#ffe9b8',
          300: '#f9dc9a',
          400: '#f0c66a',
          500: '#e2a94a',
          600: '#c0862f',
          700: '#92651f',
        },
        ember: { 400: '#ef6a60', 500: '#e5484d', 600: '#c73a3a' },
        orchid: { 400: '#a78bfa', 500: '#8b5cf6' },
        cream: '#f2ecdd',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        body: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 40px -8px rgba(226,169,74,.45)',
        card: '0 24px 60px -24px rgba(0,0,0,.7)',
      },
    },
  },
  plugins: [],
} satisfies Config;
