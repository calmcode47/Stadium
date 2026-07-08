import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#0A0E12',
        surface: '#12181F',
        elevated: '#1C242D',
        cyan: {
          DEFAULT: '#00D9FF',
          live: '#00D9FF',
        },
        amber: {
          DEFAULT: '#FFB020',
          score: '#FFB020',
        },
        success: '#2ECC71',
        danger: '#FF4757',
        'text-primary': '#E8EDF2',
        'text-muted': '#8B98A5',
      },
      textColor: {
        primary: '#E8EDF2',
        muted: '#8B98A5',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
