/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/pages/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: 'var(--app-mui-palette-primary-main)',
        secondary: 'var(--app-mui-palette-secondary-main)',
        'on-secondary': 'var(--app-mui-palette-secondary-contrastText)',
        gray: 'var(--app-mui-palette-grey-400)',
        background: 'var(--app-mui-palette-background-default)',
        'background-light': 'var(--app-mui-palette-background-paper)',
        'on-background-light': 'var(--app-mui-palette-text-secondary)',
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

export default config;
