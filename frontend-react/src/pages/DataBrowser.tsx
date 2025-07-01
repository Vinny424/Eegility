import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  Badge,
  SimpleGrid,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Icon,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
} from '@chakra-ui/react'
import { Helmet } from 'react-helmet-async'
import { 
  Search,
  Download,
  Share2,
  Eye,
  Filter,
  Calendar,
  User,
  Building,
  FileText,
  Shield,
  UserCheck,
  AlertCircle
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { DataTable, Column } from '@/components/ui/DataTable'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'

interface EegDataWithAccess {
  id: string
  filename: string
  originalFilename: string
  format: string
  size: number
  uploadDate: string
  notes: string
  tags: string[]
  isOwner: boolean
  accessType: 'Owner' | 'Admin' | 'DepartmentHead' | 'Shared'
  permission: 'ViewOnly' | 'ViewDownload'
  ownerName: string
  ownerEmail: string
  ownerInstitution: string
  adhdAnalysis?: {
    performed: boolean
    result?: string
    confidence?: number
  }
}

interface DataBrowserResponse {
  data: EegDataWithAccess[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  userRole: 'User' | 'DepartmentHead' | 'Admin'
  canViewAll: boolean
}

interface SharingRequest {
  id: string
  eegDataId: string
  sharedWithUserEmail: string
  permission: 'ViewOnly' | 'ViewDownload'
  message: string
  expiresAt?: string
}

const DataBrowser: React.FC = () => {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState<EegDataWithAccess[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ownershipFilter, setOwnershipFilter] = useState<'All' | 'OwnData' | 'SharedWithMe'>('All')
  const [userRole, setUserRole] = useState<'User' | 'DepartmentHead' | 'Admin'>('User')
  const [canViewAll, setCanViewAll] = useState(false)
  
  // Sharing modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [selectedEegData, setSelectedEegData] = useState<EegDataWithAccess | null>(null)
  const [shareRequest, setShareRequest] = useState<SharingRequest>({
    id: '',
    eegDataId: '',
    sharedWithUserEmail: '',
    permission: 'ViewOnly',
    message: ''
  })

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const pageSize = 20

  useEffect(() => {
    fetchData()
  }, [currentPage, searchTerm, ownershipFilter])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        filterByOwner: ownershipFilter
      })

      if (searchTerm) {
        params.append('searchTerm', searchTerm)
      }

      const response = await api.get<DataBrowserResponse>(`/eegdata/browse?${params}`)
      const result = response.data
      setData(result.data)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setUserRole(result.userRole)
      setCanViewAll(result.canViewAll)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch EEG data',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (eegData: EegDataWithAccess) => {
    if (eegData.permission === 'ViewOnly' && !eegData.isOwner) {
      toast({
        title: 'Access Denied',
        description: 'You only have view permission for this file',
        status: 'warning',
        duration: 5000,
        isClosable: true
      })
      return
    }

    try {
      const response = await api.get(`/eegdata/${eegData.id}/download`, {
        responseType: 'blob'
      })
      
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = eegData.originalFilename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Download error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Download failed',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleShare = (eegData: EegDataWithAccess) => {
    if (!eegData.isOwner) {
      toast({
        title: 'Access Denied',
        description: 'Only the data owner can share files',
        status: 'warning',
        duration: 5000,
        isClosable: true
      })
      return
    }

    setSelectedEegData(eegData)
    setShareRequest({
      id: '',
      eegDataId: eegData.id,
      sharedWithUserEmail: '',
      permission: 'ViewOnly',
      message: ''
    })
    setIsShareModalOpen(true)
  }

  const submitShareRequest = async () => {
    try {
      await api.post('/datasharing/requests', shareRequest)
      
      toast({
        title: 'Share Request Sent',
        description: 'The sharing request has been sent successfully',
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      setIsShareModalOpen(false)
    } catch (error: any) {
      console.error('Share error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to send sharing request',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const getAccessBadge = (eegData: EegDataWithAccess) => {
    if (eegData.isOwner) {
      return <Badge colorScheme="green" size="sm">Owner</Badge>
    }
    
    switch (eegData.accessType) {
      case 'Admin':
        return <Badge colorScheme="red" size="sm">Admin Access</Badge>
      case 'DepartmentHead':
        return <Badge colorScheme="purple" size="sm">Dept. Head</Badge>
      case 'Shared':
        return <Badge colorScheme="blue" size="sm">Shared</Badge>
      default:
        return <Badge colorScheme="gray" size="sm">Unknown</Badge>
    }
  }

  const getPermissionIcon = (eegData: EegDataWithAccess) => {
    if (eegData.isOwner || eegData.permission === 'ViewDownload') {
      return <Download size={16} />
    }
    return <Eye size={16} />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const columns: Column<EegDataWithAccess>[] = [
    {
      key: 'originalFilename',
      header: 'Filename',
      sortable: true,
      render: (value, row) => (
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium" color="brand.500">
            {value}
          </Text>
          <HStack spacing={2}>
            {getAccessBadge(row)}
            <Badge size="sm" colorScheme="gray">
              {row.format.toUpperCase()}
            </Badge>
          </HStack>
        </VStack>
      )
    },
    {
      key: 'ownerName',
      header: 'Owner',
      sortable: true,
      render: (value, row) => (
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" fontWeight="medium">
            {value}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {row.ownerInstitution}
          </Text>
        </VStack>
      )
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
      render: (value) => <Text fontSize="sm">{formatFileSize(value)}</Text>
    },
    {
      key: 'uploadDate',
      header: 'Upload Date',
      sortable: true,
      render: (value) => (
        <Text fontSize="sm">
          {new Date(value).toLocaleDateString()}
        </Text>
      )
    },
    {
      key: 'adhdAnalysis',
      header: 'ADHD Analysis',
      render: (value) => {
        if (!value) return <Text color="gray.400" fontSize="sm">Not performed</Text>
        if (!value.performed) return <Text color="orange.500" fontSize="sm">Pending</Text>
        return (
          <VStack align="start" spacing={1}>
            <Text color="green.500" fontSize="sm" fontWeight="medium">
              {value.result}
            </Text>
            {value.confidence && (
              <Text fontSize="xs" color="gray.500">
                {(value.confidence * 100).toFixed(1)}% confidence
              </Text>
            )}
          </VStack>
        )
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <HStack spacing={2}>
          <Tooltip label={row.permission === 'ViewOnly' && !row.isOwner ? 'View only' : 'Download'}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDownload(row)}
              leftIcon={getPermissionIcon(row)}
            >
              {row.permission === 'ViewOnly' && !row.isOwner ? 'View' : 'Download'}
            </Button>
          </Tooltip>
          
          {row.isOwner && (
            <Tooltip label="Share with others">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleShare(row)}
                leftIcon={<Share2 size={16} />}
              >
                Share
              </Button>
            </Tooltip>
          )}
        </HStack>
      )
    }
  ]

  return (
    <>
      <Helmet>
        <title>Data Browser - EEGility</title>
        <meta name="description" content="Browse and manage EEG data with role-based access control" />
      </Helmet>

      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Data Browser
          </Heading>
          <HStack spacing={4} mb={4}>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              Browse EEG data with secure access controls
            </Text>
            {canViewAll && (
              <Badge colorScheme="purple" variant="solid">
                {userRole === 'Admin' ? 'Admin View' : 'Department Head View'}
              </Badge>
            )}
          </HStack>
        </Box>

        {/* Filters */}
        <Card variant="elevated">
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Search</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Search size={16} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by filename, notes, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Data Ownership</FormLabel>
                <Select
                  value={ownershipFilter}
                  onChange={(e) => setOwnershipFilter(e.target.value as any)}
                >
                  <option value="All">All Accessible Data</option>
                  <option value="OwnData">My Data Only</option>
                  <option value="SharedWithMe">Shared With Me</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <Button
                  leftIcon={<Filter size={16} />}
                  onClick={fetchData}
                  colorScheme="brand"
                  size="md"
                  mt={6}
                >
                  Apply Filters
                </Button>
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Access Information */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Access Level: {userRole}</AlertTitle>
            <AlertDescription fontSize="sm">
              {userRole === 'Admin' && 'You have access to all EEG data across the system.'}
              {userRole === 'DepartmentHead' && 'You have access to all data within your department.'}
              {userRole === 'User' && 'You can view your own data and data shared with you.'}
            </AlertDescription>
          </Box>
        </Alert>

        {/* Data Table */}
        <Card variant="elevated">
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">EEG Data ({totalCount} total)</Heading>
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.600">
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <DataTable
              data={data}
              columns={columns}
              onRowClick={(row) => console.log('View details:', row)}
              emptyMessage="No EEG data found"
              isLoading={isLoading}
            />
          </CardBody>
        </Card>

        {/* Share Modal */}
        <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Share EEG Data</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  Share "{selectedEegData?.originalFilename}" with another user
                </Text>
                
                <FormControl isRequired>
                  <FormLabel>Recipient Email</FormLabel>
                  <Input
                    placeholder="Enter user email address"
                    value={shareRequest.sharedWithUserEmail}
                    onChange={(e) => setShareRequest({
                      ...shareRequest,
                      sharedWithUserEmail: e.target.value
                    })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Permission Level</FormLabel>
                  <Select
                    value={shareRequest.permission}
                    onChange={(e) => setShareRequest({
                      ...shareRequest,
                      permission: e.target.value as 'ViewOnly' | 'ViewDownload'
                    })}
                  >
                    <option value="ViewOnly">View Only</option>
                    <option value="ViewDownload">View & Download</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Message (Optional)</FormLabel>
                  <Textarea
                    placeholder="Add a message for the recipient..."
                    value={shareRequest.message}
                    onChange={(e) => setShareRequest({
                      ...shareRequest,
                      message: e.target.value
                    })}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setIsShareModalOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={submitShareRequest}
                isDisabled={!shareRequest.sharedWithUserEmail}
              >
                Send Request
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </>
  )
}

export default DataBrowser