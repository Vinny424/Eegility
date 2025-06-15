import React, { Component, ErrorInfo, ReactNode } from 'react'
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react'
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error)
      console.error('Error info:', errorInfo)
    }

    // Here you could send error to logging service
    // logError(error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onReload={this.handleReload}
      />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReload: () => void
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReload }) => {
  const { isOpen, onToggle } = useDisclosure()

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
      p={8}
    >
      <Box
        maxW="lg"
        w="full"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        rounded="lg"
        shadow="xl"
        p={8}
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={4} textAlign="center">
            <Box fontSize="6xl">🚨</Box>
            <Heading size="lg" color="red.500">
              Something went wrong
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              We're sorry, but something unexpected happened. Please try reloading the page.
            </Text>
          </VStack>

          <Alert status="error" rounded="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Error Details:</AlertTitle>
              <AlertDescription>
                {error?.message || 'Unknown error occurred'}
              </AlertDescription>
            </Box>
          </Alert>

          <VStack spacing={3}>
            <Button
              leftIcon={<RefreshCw size={16} />}
              onClick={onReload}
              colorScheme="blue"
              size="lg"
              w="full"
            >
              Reload Page
            </Button>

            {process.env.NODE_ENV === 'development' && (
              <Box w="full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  rightIcon={isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  w="full"
                >
                  {isOpen ? 'Hide' : 'Show'} Technical Details
                </Button>

                <Collapse in={isOpen} animateOpacity>
                  <Box mt={4} p={4} bg="gray.100" _dark={{ bg: 'gray.700' }} rounded="md">
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      Stack Trace:
                    </Text>
                    <Code 
                      display="block" 
                      whiteSpace="pre-wrap" 
                      fontSize="xs" 
                      p={2}
                      maxH="200px"
                      overflowY="auto"
                    >
                      {error?.stack}
                    </Code>
                    
                    {errorInfo && (
                      <>
                        <Text fontSize="sm" fontWeight="bold" mt={4} mb={2}>
                          Component Stack:
                        </Text>
                        <Code 
                          display="block" 
                          whiteSpace="pre-wrap" 
                          fontSize="xs" 
                          p={2}
                          maxH="200px"
                          overflowY="auto"
                        >
                          {errorInfo.componentStack}
                        </Code>
                      </>
                    )}
                  </Box>
                </Collapse>
              </Box>
            )}
          </VStack>

          <Text fontSize="sm" color="gray.500" textAlign="center">
            If this problem persists, please contact support with the error details above.
          </Text>
        </VStack>
      </Box>
    </Box>
  )
}

export { ErrorBoundary }