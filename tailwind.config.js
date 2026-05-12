/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans'", 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'monospace'],
      },
      colors: {
        accent: '#1d6fdb',
      },
    },
  },
  plugins: [],
};