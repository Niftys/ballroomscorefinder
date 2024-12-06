/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
    },
  },
  plugins: [],
};



