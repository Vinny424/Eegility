import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Link,
  useColorModeValue,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import { Helmet } from 'react-helmet-async'
import { 
  Mail,
  User,
  Upload,
  Brain,
  Database,
  FileText,
  Activity,
  Settings,
  ExternalLink,
  BookOpen,
  MessageCircle,
  HelpCircle
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

const Help: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const featureGuides = [
    {
      title: 'Dashboard Overview',
      icon: Database,
      description: 'View your EEG data statistics, recent uploads, and system status at a glance.',
      steps: [
        'Access key metrics like total uploads and ADHD analyses',
        'Monitor analysis success rates and processing times',
        'Check system health and processing queue status',
        'View recent upload activity with quick navigation'
      ],
      status: 'available'
    },
    {
      title: 'EEG Data Upload',
      icon: Upload,
      description: 'Upload and process EEG data files in various formats.',
      steps: [
        'Navigate to Upload EEG from the sidebar or dashboard',
        'Select your EEG files (.edf, .bdf, .set formats supported)',
        'Add patient information and metadata',
        'Monitor upload progress and processing status'
      ],
      status: 'available'
    },
    {
      title: 'ADHD Analysis',
      icon: Brain,
      description: 'AI-powered ADHD detection and analysis using machine learning models.',
      steps: [
        'Upload EEG data through the upload interface',
        'Select ADHD analysis option during upload',
        'View analysis results with confidence scores',
        'Export reports and detailed findings'
      ],
      status: 'available'
    },
    {
      title: 'Profile Management',
      icon: User,
      description: 'Manage your account settings and personal information.',
      steps: [
        'Access Profile from the top-right user menu',
        'Update personal and institutional information',
        'Manage account security settings',
        'View account activity and usage statistics'
      ],
      status: 'available'
    },
    {
      title: 'Data Browser',
      icon: Database,
      description: 'Browse and manage EEG data with role-based access control and sharing.',
      steps: [
        'View your own EEG data and data shared with you',
        'Search and filter data by filename, notes, or tags',
        'Download files (if you have permission)',
        'Share your data with other users (requires acceptance)',
        'Admins and Department Heads can view broader datasets'
      ],
      status: 'available'
    }
  ]

  const upcomingFeatures = [
    {
      title: 'Reports Generator',
      icon: FileText,
      description: 'Generate comprehensive reports and export data in multiple formats.'
    },
    {
      title: 'Live Streaming',
      icon: Activity,
      description: 'Real-time EEG data streaming and live analysis capabilities.'
    },
    {
      title: 'Advanced Settings',
      icon: Settings,
      description: 'Customize analysis parameters, notification preferences, and system settings.'
    }
  ]

  return (
    <>
      <Helmet>
        <title>Help & Support - EEGility</title>
        <meta name="description" content="Get help with EEGility features and contact support" />
      </Helmet>

      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Help & Support
          </Heading>
          <Text color="gray.600" _dark={{ color: 'gray.400' }}>
            Learn how to use EEGility's features and get assistance when you need it
          </Text>
        </Box>

        {/* Contact Information */}
        <Card variant="elevated">
          <CardHeader>
            <HStack spacing={3}>
              <MessageCircle size={24} />
              <Heading size="md">Contact Support</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="start">
              <HStack spacing={3}>
                <User size={20} />
                <Box>
                  <Text fontWeight="medium">Vincent Hartline</Text>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                    Platform Owner & Developer
                  </Text>
                </Box>
              </HStack>
              
              <HStack spacing={3}>
                <Mail size={20} />
                <Box>
                  <Link 
                    href="mailto:assetsnexus1@gmail.com"
                    color="brand.500"
                    fontWeight="medium"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    assetsnexus1@gmail.com
                  </Link>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                    For technical support, feature requests, and general inquiries
                  </Text>
                </Box>
              </HStack>

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Response Time</AlertTitle>
                  <AlertDescription fontSize="sm">
                    We aim to respond to all inquiries within 24-48 hours during business days.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </CardBody>
        </Card>

        {/* Feature Guides */}
        <Card variant="elevated">
          <CardHeader>
            <HStack spacing={3}>
              <BookOpen size={24} />
              <Heading size="md">Feature Guides</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {featureGuides.map((guide, index) => (
                <Box
                  key={index}
                  p={4}
                  bg={cardBg}
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  _hover={{ shadow: 'md' }}
                  transition="all 0.2s"
                >
                  <HStack spacing={3} mb={3}>
                    <guide.icon size={20} />
                    <Heading size="sm">{guide.title}</Heading>
                    <Badge colorScheme="green" size="sm">
                      Available
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb={3}>
                    {guide.description}
                  </Text>
                  
                  <VStack align="start" spacing={1}>
                    {guide.steps.map((step, stepIndex) => (
                      <HStack key={stepIndex} align="start" spacing={2}>
                        <Text fontSize="xs" color="brand.500" fontWeight="bold" mt={0.5}>
                          {stepIndex + 1}.
                        </Text>
                        <Text fontSize="sm">{step}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Upcoming Features */}
        <Card variant="elevated">
          <CardHeader>
            <HStack spacing={3}>
              <HelpCircle size={24} />
              <Heading size="md">Coming Soon</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Alert status="info" mb={6} borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Work in Progress</AlertTitle>
                <AlertDescription fontSize="sm">
                  The following features are currently under development and will be available in future updates.
                </AlertDescription>
              </Box>
            </Alert>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {upcomingFeatures.map((feature, index) => (
                <Box
                  key={index}
                  p={4}
                  bg={cardBg}
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  opacity={0.7}
                >
                  <HStack spacing={3} mb={2}>
                    <feature.icon size={18} />
                    <Heading size="sm">{feature.title}</Heading>
                    <Badge colorScheme="orange" size="sm">
                      Soon
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                    {feature.description}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Quick Tips */}
        <Card variant="elevated">
          <CardHeader>
            <Heading size="md">Quick Tips</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontWeight="medium" mb={1}>🚀 Getting Started</Text>
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  Start by uploading your first EEG file through the Upload page, then monitor processing on the Dashboard.
                </Text>
              </Box>
              
              <Divider />
              
              <Box>
                <Text fontWeight="medium" mb={1}>📊 Supported Formats</Text>
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  EEGility supports .edf, .bdf, and .set file formats for EEG data upload and analysis.
                </Text>
              </Box>
              
              <Divider />
              
              <Box>
                <Text fontWeight="medium" mb={1}>🧠 ADHD Analysis</Text>
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  Our AI model provides ADHD detection with confidence scores. Results include detailed analysis reports.
                </Text>
              </Box>
              
              <Divider />
              
              <Box>
                <Text fontWeight="medium" mb={1}>🌙 Dark Mode</Text>
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  Toggle between light and dark themes using the moon/sun icon in the top navigation bar.
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Footer */}
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Need immediate assistance? Don't hesitate to reach out via email.
          </Text>
          <Button
            as={Link}
            href="mailto:assetsnexus1@gmail.com"
            colorScheme="brand"
            size="sm"
            mt={2}
            leftIcon={<ExternalLink size={16} />}
          >
            Contact Support
          </Button>
        </Box>
      </VStack>
    </>
  )
}

export default Help