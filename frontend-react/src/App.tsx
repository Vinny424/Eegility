import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AppRoutes } from './components/AppRoutes'
import { theme } from './theme'
import { ErrorBoundary } from './components/ErrorBoundary'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

function App() {
  return (
    <HelmetProvider>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </BrowserRouter>
        </QueryClientProvider>
      </ChakraProvider>
    </HelmetProvider>
  )
}

export default App