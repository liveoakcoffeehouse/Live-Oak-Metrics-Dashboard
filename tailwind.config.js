/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        espresso: {
          50: '#f7f3f0',
          100: '#ede2da',
          200: '#d8c2b2',
          300: '#c19d80',
          400: '#a97a58',
          500: '#8a5f42',
          600: '#6b4a35',
          700: '#4f372a',
          800: '#38271e',
          900: '#241812',
        },
        cream: '#f5efe6',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
