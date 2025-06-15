import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Progress,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Badge,
  Divider
} from '@chakra-ui/react'
import { ArrowBackIcon, RepeatIcon } from '@chakra-ui/icons'

interface AnalysisResult {
  id: string
  eegId: string
  prediction: 'ADHD' | 'Non-ADHD'
  confidence: number
  features: {
    thetaBetaRatio: number
    deltaActivity: number
    alphaActivity: number
    betaActivity: number
    thetaActivity: number
  }
  processingTime: number
  completedAt: string
  status: 'running' | 'completed' | 'failed'
}

const AdhdAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate fetching existing analysis or starting new one
    const fetchAnalysis = async () => {
      if (!id) return

      try {
        setIsLoading(true)
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if analysis already exists
        const existingAnalysis = localStorage.getItem(`analysis_${id}`)
        
        if (existingAnalysis) {
          setAnalysis(JSON.parse(existingAnalysis))
        } else {
          // Start new analysis
          startAnalysis()
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load analysis')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [id])

  const startAnalysis = async () => {
    setIsRunning(true)
    setProgress(0)
    setError(null)

    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 15
        })
      }, 500)

      // Simulate analysis completion after 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      clearInterval(progressInterval)
      setProgress(100)

      // Generate mock analysis result
      const mockResult: AnalysisResult = {
        id: `analysis_${Date.now()}`,
        eegId: id!,
        prediction: Math.random() > 0.5 ? 'ADHD' : 'Non-ADHD',
        confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
        features: {
          thetaBetaRatio: Math.round((2 + Math.random() * 3) * 100) / 100,
          deltaActivity: Math.round((15 + Math.random() * 10) * 100) / 100,
          alphaActivity: Math.round((25 + Math.random() * 15) * 100) / 100,
          betaActivity: Math.round((20 + Math.random() * 10) * 100) / 100,
          thetaActivity: Math.round((30 + Math.random() * 15) * 100) / 100
        },
        processingTime: 4.7,
        completedAt: new Date().toISOString(),
        status: 'completed'
      }

      setAnalysis(mockResult)
      localStorage.setItem(`analysis_${id}`, JSON.stringify(mockResult))
      
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunNewAnalysis = () => {
    localStorage.removeItem(`analysis_${id}`)
    setAnalysis(null)
    startAnalysis()
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text>Loading analysis...</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return (
      <VStack spacing={4}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </VStack>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <HStack spacing={4}>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate(`/eeg/${id}`)}
          >
            Back to EEG Details
          </Button>
          <Heading size="lg">ADHD Analysis</Heading>
        </HStack>

        {analysis && (
          <Button
            leftIcon={<RepeatIcon />}
            colorScheme="brand"
            variant="outline"
            onClick={handleRunNewAnalysis}
            isDisabled={isRunning}
          >
            Run New Analysis
          </Button>
        )}
      </HStack>

      {/* Analysis Progress */}
      {isRunning && (
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="semibold">
                Running ADHD Classification Analysis...
              </Text>
              <Progress
                value={progress}
                size="lg"
                colorScheme="brand"
                width="100%"
                borderRadius="md"
              />
              <Text fontSize="sm" color="gray.600">
                {progress < 30 && "Preprocessing EEG signals..."}
                {progress >= 30 && progress < 60 && "Extracting frequency domain features..."}
                {progress >= 60 && progress < 90 && "Running machine learning classification..."}
                {progress >= 90 && "Finalizing results..."}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && analysis.status === 'completed' && (
        <>
          {/* Main Result */}
          <Card>
            <CardHeader>
              <Heading size="md">Classification Result</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <HStack spacing={4} align="center">
                  <Badge
                    colorScheme={analysis.prediction === 'ADHD' ? 'red' : 'green'}
                    fontSize="xl"
                    p={3}
                    borderRadius="md"
                  >
                    {analysis.prediction}
                  </Badge>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="semibold">
                      Confidence: {(analysis.confidence * 100).toFixed(1)}%
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Processing Time: {analysis.processingTime}s
                    </Text>
                  </VStack>
                </HStack>

                <Divider />

                <Box width="100%">
                  <Text mb={3} fontWeight="semibold">
                    Interpretation:
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {analysis.prediction === 'ADHD' 
                      ? "The analysis indicates patterns consistent with ADHD characteristics in the EEG signal. This includes elevated theta/beta ratio and altered frequency power distributions."
                      : "The analysis indicates patterns consistent with typical EEG activity. The frequency distributions and theta/beta ratio are within normal ranges."
                    }
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Feature Analysis */}
          <Card>
            <CardHeader>
              <Heading size="md">EEG Feature Analysis</Heading>
            </CardHeader>
            <CardBody>
              <StatGroup>
                <Stat>
                  <StatLabel>Theta/Beta Ratio</StatLabel>
                  <StatNumber>{analysis.features.thetaBetaRatio}</StatNumber>
                  <StatHelpText>
                    <StatArrow type={analysis.features.thetaBetaRatio > 4 ? 'increase' : 'decrease'} />
                    {analysis.features.thetaBetaRatio > 4 ? 'Elevated' : 'Normal'}
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Delta Activity</StatLabel>
                  <StatNumber>{analysis.features.deltaActivity}%</StatNumber>
                  <StatHelpText>1-4 Hz</StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Theta Activity</StatLabel>
                  <StatNumber>{analysis.features.thetaActivity}%</StatNumber>
                  <StatHelpText>4-8 Hz</StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Alpha Activity</StatLabel>
                  <StatNumber>{analysis.features.alphaActivity}%</StatNumber>
                  <StatHelpText>8-12 Hz</StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Beta Activity</StatLabel>
                  <StatNumber>{analysis.features.betaActivity}%</StatNumber>
                  <StatHelpText>12-30 Hz</StatHelpText>
                </Stat>
              </StatGroup>
            </CardBody>
          </Card>

          {/* Clinical Notes */}
          <Card>
            <CardHeader>
              <Heading size="md">Clinical Notes</Heading>
            </CardHeader>
            <CardBody>
              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={2}>
                  <Text fontWeight="semibold">
                    Important: This analysis is for research purposes only
                  </Text>
                  <Text fontSize="sm">
                    This automated analysis should not be used as the sole basis for clinical diagnosis. 
                    ADHD diagnosis requires comprehensive clinical evaluation by qualified healthcare professionals, 
                    including behavioral assessments, medical history, and multiple diagnostic criteria.
                  </Text>
                </VStack>
              </Alert>
            </CardBody>
          </Card>
        </>
      )}

      {/* Start Analysis Button */}
      {!analysis && !isRunning && (
        <Card>
          <CardBody textAlign="center">
            <VStack spacing={4}>
              <Text fontSize="lg">
                Ready to run ADHD classification analysis on this EEG recording
              </Text>
              <Button
                colorScheme="brand"
                size="lg"
                onClick={startAnalysis}
              >
                Start Analysis
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}

export default AdhdAnalysis