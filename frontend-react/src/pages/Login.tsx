import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Heading,
  Alert,
  AlertIcon,
  Container,
  Card,
  CardBody,
  Link,
  HStack,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Brain } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Helmet } from 'react-helmet-async'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoginPending, loginError } = useAuth()

  const bg = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('white', 'gray.700')

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data)
      navigate(from, { replace: true })
    } catch (error) {
      // Error is handled by the auth hook
    }
  }

  return (
    <>
      <Helmet>
        <title>Login - EEGility</title>
        <meta name="description" content="Login to your EEGility account" />
      </Helmet>

      <Box
        minH="100vh"
        bg={bg}
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={12}
        px={4}
      >
        <Container maxW="sm">
          <VStack spacing={8} align="stretch">
            {/* Logo and Title */}
            <VStack spacing={4} textAlign="center">
              <HStack justify="center" spacing={3}>
                <Box
                  w={12}
                  h={12}
                  bg="brand.500"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Brain color="white" size={28} />
                </Box>
                <Heading size="xl" color="brand.500">
                  EEGility
                </Heading>
              </HStack>
              <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                EEG Data Analysis Platform
              </Text>
            </VStack>

            {/* Login Form */}
            <Card bg={cardBg} shadow="xl">
              <CardBody p={8}>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" mb={2}>
                      Welcome back
                    </Heading>
                    <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                      Sign in to your account
                    </Text>
                  </Box>

                  {loginError && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {loginError}
                    </Alert>
                  )}

                  <Box as="form" onSubmit={handleSubmit(onSubmit)}>
                    <VStack spacing={4}>
                      <FormControl isInvalid={!!errors.email}>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...register('email')}
                        />
                        {errors.email && (
                          <Text color="red.500" fontSize="sm" mt={1}>
                            {errors.email.message}
                          </Text>
                        )}
                      </FormControl>

                      <FormControl isInvalid={!!errors.password}>
                        <FormLabel>Password</FormLabel>
                        <InputGroup>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            {...register('password')}
                          />
                          <InputRightElement>
                            <IconButton
                              variant="ghost"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              icon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              onClick={() => setShowPassword(!showPassword)}
                            />
                          </InputRightElement>
                        </InputGroup>
                        {errors.password && (
                          <Text color="red.500" fontSize="sm" mt={1}>
                            {errors.password.message}
                          </Text>
                        )}
                      </FormControl>

                      <Button
                        type="submit"
                        size="lg"
                        w="full"
                        isLoading={isLoginPending || isSubmitting}
                        loadingText="Signing in..."
                      >
                        Sign In
                      </Button>
                    </VStack>
                  </Box>

                  <HStack justify="center" spacing={1}>
                    <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                      Don't have an account?
                    </Text>
                    <Link as={RouterLink} to="/register" color="brand.500" fontWeight="medium">
                      Sign up
                    </Link>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Demo Credentials for Development */}
            {process.env.NODE_ENV === 'development' && (
              <Card bg="blue.50" _dark={{ bg: 'blue.900' }}>
                <CardBody p={4}>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="blue.700" _dark={{ color: 'blue.200' }}>
                    Demo Credentials:
                  </Text>
                  <Text fontSize="sm" color="blue.600" _dark={{ color: 'blue.300' }}>
                    Email: demo@eegility.com<br />
                    Password: Demo123!
                  </Text>
                </CardBody>
              </Card>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  )
}

export default Login