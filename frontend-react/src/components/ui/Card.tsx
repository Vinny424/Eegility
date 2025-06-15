import React from 'react'
import {
  Box,
  BoxProps,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react'

interface CardProps extends BoxProps {
  variant?: 'outline' | 'filled' | 'elevated'
  interactive?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  interactive = false,
  ...props
}) => {
  const theme = useTheme()
  
  const getCardStyles = () => {
    const baseStyles = {
      borderRadius: 'lg',
      transition: 'all 0.2s ease-in-out',
      position: 'relative' as const,
      overflow: 'hidden',
    }

    const interactiveStyles = interactive
      ? {
          cursor: 'pointer',
          transform: 'scale(1)',
          _hover: {
            transform: 'translateY(-2px)',
            shadow: 'lg',
          },
          _active: {
            transform: 'translateY(0)',
          },
        }
      : {}

    switch (variant) {
      case 'outline':
        return {
          ...baseStyles,
          ...interactiveStyles,
          bg: useColorModeValue('white', 'gray.800'),
          border: '1px solid',
          borderColor: useColorModeValue('gray.200', 'gray.700'),
          shadow: 'none',
          _hover: interactive
            ? {
                ...interactiveStyles._hover,
                borderColor: useColorModeValue('brand.300', 'brand.600'),
              }
            : {},
        }

      case 'filled':
        return {
          ...baseStyles,
          ...interactiveStyles,
          bg: useColorModeValue('gray.50', 'gray.700'),
          border: 'none',
          shadow: 'none',
          _hover: interactive
            ? {
                ...interactiveStyles._hover,
                bg: useColorModeValue('gray.100', 'gray.600'),
              }
            : {},
        }

      case 'elevated':
      default:
        return {
          ...baseStyles,
          ...interactiveStyles,
          bg: useColorModeValue('white', 'gray.800'),
          border: '1px solid',
          borderColor: useColorModeValue('gray.100', 'gray.700'),
          shadow: 'sm',
          _hover: interactive
            ? {
                ...interactiveStyles._hover,
                shadow: 'md',
                borderColor: useColorModeValue('brand.200', 'brand.700'),
              }
            : {},
        }
    }
  }

  return (
    <Box {...getCardStyles()} {...props}>
      {children}
    </Box>
  )
}

export const CardHeader: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box
      px={6}
      py={4}
      borderBottom="1px solid"
      borderColor={useColorModeValue('gray.100', 'gray.700')}
      {...props}
    >
      {children}
    </Box>
  )
}

export const CardBody: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box px={6} py={4} {...props}>
      {children}
    </Box>
  )
}

export const CardFooter: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box
      px={6}
      py={4}
      borderTop="1px solid"
      borderColor={useColorModeValue('gray.100', 'gray.700')}
      bg={useColorModeValue('gray.50', 'gray.750')}
      {...props}
    >
      {children}
    </Box>
  )
}