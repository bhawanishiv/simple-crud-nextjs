import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { Roboto } from 'next/font/google';

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

// Create a theme instance.

const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#ffffff',
    },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  shape: {
    borderRadius: 8,
  },

  cssVariables: {
    cssVarPrefix: 'app-mui',
    colorSchemeSelector: 'class',
  },
});

export default theme;
