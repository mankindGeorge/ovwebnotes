/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        vault: {
          bg: '#1e1e2e',
          surface: '#282840',
          border: '#3b3b5c',
          muted: '#6c6c8a',
          text: '#cdd6f4',
          accent: '#cba6f7',
          highlight: '#45475a',
        },
        warm: {
          bg: '#fefaf6',
          surface: '#fdf5ed',
          card: '#fffbf7',
          border: '#e8ddd0',
          'border-light': '#f0e6d9',
          text: '#4a3f35',
          'text-secondary': '#6b5d52',
          'text-muted': '#9a8b7f',
          hover: '#f5ede3',
          active: '#ebe3d9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.obsidian.800'),
            '--tw-prose-headings': theme('colors.obsidian.900'),
            '--tw-prose-links': theme('colors.obsidian.600'),
            '--tw-prose-code': theme('colors.obsidian.700'),
            'mark': {
              'background-color': theme('colors.amber.200'),
              'padding': '0.1rem 0.2rem',
              'border-radius': '0.125rem',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.obsidian.200'),
            '--tw-prose-headings': theme('colors.obsidian.100'),
            '--tw-prose-links': theme('colors.obsidian.400'),
            '--tw-prose-code': theme('colors.obsidian.300'),
            'mark': {
              'background-color': theme('colors.amber.700'),
              'color': theme('colors.amber.100'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
