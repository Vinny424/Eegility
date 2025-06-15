import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Container
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} textAlign="center">
        {/* 404 Visual */}
        <Box>
          <Text
            fontSize="8xl"
            fontWeight="bold"
            bgGradient="linear(to-r, brand.400, brand.600)"
            bgClip="text"
            lineHeight="1"
          >
            404
          </Text>
        </Box>

        {/* Error Message */}
        <VStack spacing={4}>
          <Heading size="xl" color="gray.700">
            Page Not Found
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="md">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </Text>
        </VStack>

        {/* Brain Wave Illustration */}
        <Box py={8}>
          <svg
            width="200"
            height="60"
            viewBox="0 0 200 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 30 Q20 10, 30 30 T50 30 Q60 50, 70 30 T90 30 Q100 10, 110 30 T130 30 Q140 50, 150 30 T170 30 Q180 10, 190 30"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
            />
            <circle cx="20" cy="30" r="2" fill="currentColor" opacity="0.8" />
            <circle cx="100" cy="30" r="2" fill="currentColor" opacity="0.8" />
            <circle cx="180" cy="30" r="2" fill="currentColor" opacity="0.8" />
          </svg>
        </Box>

        {/* Navigation Buttons */}
        <VStack spacing={3}>
          <Button
            leftIcon={<ArrowBackIcon />}
            colorScheme="brand"
            size="lg"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </VStack>

        {/* Helpful Links */}
        <Box pt={8}>
          <Text fontSize="sm" color="gray.500" mb={3}>
            Quick Links:
          </Text>
          <VStack spacing={2}>
            <Button
              variant="link"
              size="sm"
              color="brand.500"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant="link"
              size="sm"
              color="brand.500"
              onClick={() => navigate('/upload')}
            >
              Upload EEG Data
            </Button>
            <Button
              variant="link"
              size="sm"
              color="brand.500"
              onClick={() => navigate('/profile')}
            >
              Profile Settings
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default NotFound