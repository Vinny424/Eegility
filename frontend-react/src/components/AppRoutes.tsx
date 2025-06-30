import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Box, Spinner, Center } from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from './Layout'

// Lazy load pages for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const EegUpload = lazy(() => import('@/pages/EegUpload'))
const EegDetail = lazy(() => import('@/pages/EegDetail'))
const AdhdAnalysis = lazy(() => import('@/pages/AdhdAnalysis'))
const Profile = lazy(() => import('@/pages/Profile'))
const Help = lazy(() => import('@/pages/Help'))
const DataBrowser = lazy(() => import('@/pages/DataBrowser'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Loading component
const PageLoader = () => (
  <Center h="50vh">
    <Box textAlign="center">
      <Spinner size="xl" color="brand.500" thickness="4px" />
      <Box mt={4} fontSize="sm" color="gray.600">
        Loading...
      </Box>
    </Box>
  </Center>
)

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route component (redirect to dashboard if authenticated)
interface PublicRouteProps {
  children: React.ReactNode
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected routes with layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<EegUpload />} />
          <Route path="eeg/:id" element={<EegDetail />} />
          <Route path="analysis/:id" element={<AdhdAnalysis />} />
          <Route path="profile" element={<Profile />} />
          <Route path="help" element={<Help />} />
          <Route path="browse" element={<DataBrowser />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}