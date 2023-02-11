/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#556cd6',
        secondary: '#19857b',
        'on-secondary': '#FFFFFF',
        gray: '#dbdbdb',
      },
    },
  },
  plugins: [],
};
