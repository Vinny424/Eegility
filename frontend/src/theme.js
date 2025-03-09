// src/theme.js
import { createMuiTheme } from '@material-ui/core/styles';
import { blue, orange } from '@material-ui/core/colors';

const theme = createMuiTheme({
  palette: {
    primary: {
      light: blue[300],
      main: blue[500],
      dark: blue[700],
      contrastText: '#fff',
    },
    secondary: {
      light: orange[300],
      main: orange[500],
      dark: orange[700],
      contrastText: '#fff',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  overrides: {
    MuiButton: {
      root: {
        textTransform: 'none',
        borderRadius: 8,
      },
    },
    MuiPaper: {
      rounded: {
        borderRadius: 8,
      },
    },
    MuiCard: {
      root: {
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
    MuiCardHeader: {
      root: {
        padding: '16px 24px',
      },
    },
    MuiCardContent: {
      root: {
        padding: '24px',
        '&:last-child': {
          paddingBottom: '24px',
        },
      },
    },
  },
  props: {
    MuiButton: {
      disableElevation: true,
    },
    MuiTextField: {
      variant: 'outlined',
    },
  },
});

export default theme;