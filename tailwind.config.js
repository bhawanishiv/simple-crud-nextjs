/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['src/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#556cd6',
        secondary: '#19857b',
        'on-secondary': '#FFFFFF',
        gray: '#dbdbdb',
        background: '#ffffff',
        'background-light': '#F0EEED',
        'on-background-light': '#747474',
      },
      animation: {
        type: 'type 1.8s ease-out .8s 1 normal both',
      },
      keyframes: {
        type: {
          '0%': { width: '0ch' },
          '5%, 10%': { width: '1ch' },
          '15%, 20%': { width: '2ch' },
          '25%, 30%': { width: '3ch' },
          '35%, 40%': { width: '4ch' },
          '45%, 50%': { width: '5ch' },
          '55%, 60%': { width: '6ch' },
          '65%, 70%': { width: '7ch' },
          '75%, 80%': { width: '8ch' },
          '85%, 90%': { width: '9ch' },
          '95%': { width: '10ch' },
        },
      },
    },
  },
  plugins: [],
};
