/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36abf7',
          500: '#0c8ee9',
          600: '#0170c7',
          700: '#0259a1',
          800: '#064b84',
          900: '#0b3f6f',
          950: '#072849',
        },
        navy: {
          800: '#0B192C',
          900: '#060E1A',
          950: '#03070D',
        },
        gold: {
          400: '#F5C518',
          500: '#D4AF37',
          600: '#AA820A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 25px rgba(12, 142, 233, 0.25)',
        'glow-gold': '0 0 25px rgba(212, 175, 55, 0.25)',
      }
    },
  },
  plugins: [],
}
