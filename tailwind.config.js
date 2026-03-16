/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0faf3',
          100: '#d8f3df',
          200: '#b4e6c2',
          300: '#82d09e',
          400: '#4caf74',
          500: '#2e8f53',
          600: '#1a5c2e',
          700: '#154d26',
          800: '#103d1e',
          900: '#0a2d15',
        },
        tierra: {
          100: '#f5ead6',
          300: '#d4a853',
          500: '#8b6914',
          700: '#5c4309',
        },
        neutral: {
          50:  '#f8f9f8',
          100: '#f0f2f0',
          200: '#e2e6e2',
          400: '#9aa89a',
          600: '#5a6b5a',
          800: '#2d3b2d',
          900: '#1a241a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft':  '0 2px 15px rgba(0,0,0,0.06)',
        'card':  '0 4px 24px rgba(0,0,0,0.08)',
        'hover': '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}