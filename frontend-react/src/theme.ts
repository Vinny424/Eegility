import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
}

const colors = {
  brand: {
    50: '#E6F7FF',
    100: '#B3E9FF',
    200: '#80DBFF',
    300: '#4DCDFF',
    400: '#1ABFFF',
    500: '#0099E6', // Primary brand color
    600: '#007AB3',
    700: '#005C80',
    800: '#003D4D',
    900: '#001F26',
  },
  secondary: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },
  success: {
    50: '#F0FFF4',
    100: '#C6F6D5',
    200: '#9AE6B4',
    300: '#68D391',
    400: '#48BB78',
    500: '#38A169',
    600: '#2F855A',
    700: '#276749',
    800: '#22543D',
    900: '#1C4532',
  },
  warning: {
    50: '#FFFBF0',
    100: '#FEF5E7',
    200: '#FED7AA',
    300: '#FDB560',
    400: '#F6AD55',
    500: '#ED8936',
    600: '#DD6B20',
    700: '#C05621',
    800: '#9C4221',
    900: '#7B341E',
  },
  error: {
    50: '#FFF5F5',
    100: '#FED7D7',
    200: '#FEB2B2',
    300: '#FC8181',
    400: '#F56565',
    500: '#E53E3E',
    600: '#C53030',
    700: '#9B2C2C',
    800: '#822727',
    900: '#63171B',
  },
}

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
}

const components = {
  Button: {
    defaultProps: {
      colorScheme: 'brand',
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          _disabled: {
            bg: 'brand.500',
          },
        },
        _active: {
          bg: 'brand.700',
        },
      },
      outline: {
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
          _disabled: {
            bg: 'transparent',
          },
        },
        _active: {
          bg: 'brand.100',
        },
      },
      ghost: {
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
          _disabled: {
            bg: 'transparent',
          },
        },
        _active: {
          bg: 'brand.100',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        shadow: 'sm',
        rounded: 'lg',
        border: '1px',
        borderColor: 'gray.200',
        _dark: {
          bg: 'gray.800',
          borderColor: 'gray.700',
        },
      },
    },
  },
  Input: {
    defaultProps: {
      focusBorderColor: 'brand.500',
    },
  },
  Textarea: {
    defaultProps: {
      focusBorderColor: 'brand.500',
    },
  },
  Select: {
    defaultProps: {
      focusBorderColor: 'brand.500',
    },
  },
  Progress: {
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  Alert: {
    variants: {
      subtle: {
        container: {
          bg: 'brand.50',
          _dark: {
            bg: 'brand.900',
          },
        },
        icon: {
          color: 'brand.500',
        },
      },
    },
  },
}

const styles = {
  global: {
    body: {
      bg: 'gray.50',
      _dark: {
        bg: 'gray.900',
      },
    },
  },
}

export const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles,
  space: {
    '18': '4.5rem',
    '88': '22rem',
  },
  sizes: {
    '18': '4.5rem',
    '88': '22rem',
  },
})