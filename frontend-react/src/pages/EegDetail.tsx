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
  Badge,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast
} from '@chakra-ui/react'
import { ArrowBackIcon, DownloadIcon } from '@chakra-ui/icons'
import { useEegData } from '@/hooks/useEegData'
import { formatDistanceToNow } from 'date-fns'

const EegDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { getEegDataQuery, downloadEegDataFile } = useEegData()
  
  const [isDownloading, setIsDownloading] = useState(false)
  
  const eegQuery = getEegDataQuery(id || '')
  const eegData = eegQuery.data
  const isLoading = eegQuery.isLoading
  const error = eegQuery.error?.message

  const handleDownload = async () => {
    if (!id) return

    try {
      setIsDownloading(true)
      await downloadEegDataFile(id, eegData?.originalFilename || 'eeg-data')
      
      toast({
        title: 'Download started',
        description: 'Your EEG file is being downloaded',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err: any) {
      toast({
        title: 'Download failed',
        description: err.message || 'Failed to download EEG file',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRunAnalysis = () => {
    navigate(`/analysis/${id}`)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text>Loading EEG data...</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    )
  }

  if (!eegData) {
    return (
      <Box>
        <Alert status="warning">
          <AlertIcon />
          EEG data not found
        </Alert>
      </Box>
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
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <VStack align="start" spacing={1}>
            <Heading size="lg">{eegData.filename}</Heading>
            <HStack spacing={2}>
              <Badge colorScheme={eegData.bidsCompliant ? 'green' : 'yellow'}>
                {eegData.bidsCompliant ? 'Processed' : 'Processing'}
              </Badge>
              <Text fontSize="sm" color="gray.600">
                Uploaded {formatDistanceToNow(new Date(eegData.uploadDate))} ago
              </Text>
            </HStack>
          </VStack>
        </HStack>

        <HStack spacing={2}>
          <Button
            leftIcon={<DownloadIcon />}
            variant="outline"
            isLoading={isDownloading}
            loadingText="Downloading..."
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleRunAnalysis}
            isDisabled={!eegData.bidsCompliant}
          >
            Run ADHD Analysis
          </Button>
        </HStack>
      </HStack>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <Heading size="md">Recording Statistics</Heading>
        </CardHeader>
        <CardBody>
          <StatGroup>
            <Stat>
              <StatLabel>Duration</StatLabel>
              <StatNumber>{eegData.metadata?.duration || 'N/A'}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Channels</StatLabel>
              <StatNumber>{eegData.metadata?.channels || 'N/A'}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Sample Rate</StatLabel>
              <StatNumber>{eegData.metadata?.sampleRate || 'N/A'} Hz</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>File Size</StatLabel>
              <StatNumber>{eegData.size || 'N/A'}</StatNumber>
            </Stat>
          </StatGroup>
        </CardBody>
      </Card>

      {/* Detailed Information */}
      <Tabs>
        <TabList>
          <Tab>Metadata</Tab>
          <Tab>Processing Log</Tab>
          <Tab>Analysis History</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Subject Information</Text>
                    <VStack align="stretch" spacing={2} pl={4}>
                      <HStack justify="space-between">
                        <Text>Subject ID:</Text>
                        <Text>{eegData.metadata?.subject?.id || 'N/A'}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Age:</Text>
                        <Text>{eegData.metadata?.subject?.age || 'N/A'}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Gender:</Text>
                        <Text>{eegData.metadata?.subject?.gender || 'N/A'}</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2}>Recording Information</Text>
                    <VStack align="stretch" spacing={2} pl={4}>
                      <HStack justify="space-between">
                        <Text>Recording Date:</Text>
                        <Text>{eegData.uploadDate || 'N/A'}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Device:</Text>
                        <Text>{'EEG Device'}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Notes:</Text>
                        <Text>{eegData.notes || 'None'}</Text>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <CardBody>
                <Text>Processing log information would be displayed here...</Text>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <CardBody>
                <Text>Analysis history would be displayed here...</Text>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  )
}

export default EegDetail