import { useState } from 'react'
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Link,
  useToast,
  Container,
  Divider,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type RegisterFormData = z.infer<typeof registerSchema>

const Register: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  // Dark mode responsive colors
  const formBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.400')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password
      })

      toast({
        title: 'Registration successful',
        description: 'Welcome to EEGility! You are now logged in.',
        status: 'success',
        duration: 5000,
        isClosable: true
      })

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading size="xl" mb={2}>
            Join EEGility
          </Heading>
          <Text color={textColor}>
            Create your account to start analyzing EEG data
          </Text>
        </Box>

        <Box w="full" bg={formBg} p={8} borderRadius="lg" boxShadow="md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4}>
              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <FormControl isInvalid={!!errors.firstName}>
                <FormLabel>First Name</FormLabel>
                <Input
                  {...register('firstName')}
                  placeholder="Enter your first name"
                />
                <FormErrorMessage>
                  {errors.firstName?.message}
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.lastName}>
                <FormLabel>Last Name</FormLabel>
                <Input
                  {...register('lastName')}
                  placeholder="Enter your last name"
                />
                <FormErrorMessage>
                  {errors.lastName?.message}
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Enter your email"
                />
                <FormErrorMessage>
                  {errors.email?.message}
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="Enter your password"
                />
                <FormErrorMessage>
                  {errors.password?.message}
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="Confirm your password"
                />
                <FormErrorMessage>
                  {errors.confirmPassword?.message}
                </FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                width="full"
                isLoading={isLoading}
                loadingText="Creating account..."
              >
                Create Account
              </Button>
            </VStack>
          </form>

          <Divider my={6} />

          <Text textAlign="center" fontSize="sm" color={textColor}>
            Already have an account?{' '}
            <Link as={RouterLink} to="/login" color="brand.500" fontWeight="medium">
              Sign in here
            </Link>
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}

export default Register