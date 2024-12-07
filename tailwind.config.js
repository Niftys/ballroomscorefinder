/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'scrollbar-thumb': '#5a3e95',
        'scrollbar-track': '#2d3748',
        gold: {
          400: '#ebc817',
          500: '#c6a914',
          600: '#978111',
        },
        purple: {
          400: '#1a0c3e'
        },
        blue: {
          400: '#355262'
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



