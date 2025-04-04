/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'scrollbar-thumb': '#5a3e95',
        'scrollbar-track': '#2d3748',
        gold: {
          400: '#D4AF37',
          500: '#C5A027',
          600: '#B68F20',
          700: '#A77E17',
        },
        purple: {
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3E1B92',
        },
        gray: {
          900: '#111113',
          800: '#1A1A1D',
          700: '#2D2D32',
        },
      },
      width: {
        'scrollbar': '8px', // Custom scrollbar width
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};



