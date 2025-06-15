import React, { useState } from 'react'
import {
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Divider,
  Box,
  Badge,
} from '@chakra-ui/react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Upload as UploadIcon, CheckCircle } from 'lucide-react'

import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { FileUpload } from '@/components/ui/FileUpload'
import { Icons } from '@/components/icons'
import { useEegData } from '@/hooks/useEegData'

const uploadSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required').regex(/^[a-zA-Z0-9]+$/, 'Only alphanumeric characters allowed'),
  subjectAge: z.number().min(1).max(150).optional(),
  subjectGender: z.enum(['M', 'F', 'O', '']).optional(),
  subjectGroup: z.string().optional(),
  session: z.string().optional(),
  task: z.string().min(1, 'Task is required'),
  acquisition: z.string().optional(),
  notes: z.string().optional(),
})

type UploadForm = z.infer<typeof uploadSchema>

const EegUpload: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { uploadEegData, isUploading, uploadProgress, uploadError } = useEegData()
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      task: 'rest',
      session: 'baseline',
    },
  })

  const onFilesAccepted = (files: File[]) => {
    setSelectedFiles(files)
    setUploadSuccess(false)
  }

  const onFileRemove = (fileToRemove: File) => {
    setSelectedFiles(files => files.filter(file => file !== fileToRemove))
  }

  const onSubmit = async (data: UploadForm) => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No file selected',
        description: 'Please select an EEG file to upload',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      for (const file of selectedFiles) {
        await uploadEegData({
          file,
          subjectId: data.subjectId,
          subjectAge: data.subjectAge,
          subjectGender: data.subjectGender,
          subjectGroup: data.subjectGroup,
          session: data.session,
          task: data.task,
          acquisition: data.acquisition,
          notes: data.notes,
        })
      }

      setUploadSuccess(true)
      toast({
        title: 'Upload successful',
        description: `${selectedFiles.length} file(s) uploaded successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Reset form and files after successful upload
      setTimeout(() => {
        reset()
        setSelectedFiles([])
        setUploadSuccess(false)
        navigate('/dashboard')
      }, 2000)

    } catch (error) {
      toast({
        title: 'Upload failed',
        description: uploadError || 'An error occurred during upload',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const taskOptions = [
    { value: 'rest', label: 'Resting State' },
    { value: 'oddball', label: 'Oddball Task' },
    { value: 'n-back', label: 'N-Back Task' },
    { value: 'attention', label: 'Attention Task' },
    { value: 'memory', label: 'Memory Task' },
    { value: 'stroop', label: 'Stroop Task' },
    { value: 'motor', label: 'Motor Task' },
    { value: 'language', label: 'Language Task' },
    { value: 'other', label: 'Other' },
  ]

  const sessionOptions = [
    { value: 'baseline', label: 'Baseline' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'pre', label: 'Pre-treatment' },
    { value: 'post', label: 'Post-treatment' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <>
      <Helmet>
        <title>Upload EEG Data - EEGility</title>
        <meta name="description" content="Upload EEG data files for analysis" />
      </Helmet>

      <VStack spacing={6} align="stretch" maxW="4xl" mx="auto">
        {/* Header */}
        <Box>
          <HStack spacing={3} mb={2}>
            <Icons.DataUpload size={32} color="#0099E6" />
            <Heading size="lg">Upload EEG Data</Heading>
          </HStack>
          <Text color="gray.600" _dark={{ color: 'gray.400' }}>
            Upload EEG files and provide metadata for BIDS-compliant storage and analysis
          </Text>
        </Box>

        {/* Success Message */}
        {uploadSuccess && (
          <Alert status="success" borderRadius="lg">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <AlertTitle>Upload Successful!</AlertTitle>
              <AlertDescription>
                Your EEG data has been uploaded and will be processed shortly. 
                Redirecting to dashboard...
              </AlertDescription>
            </VStack>
          </Alert>
        )}

        {/* Upload Error */}
        {uploadError && (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <AlertTitle>Upload Error:</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </VStack>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={6} align="stretch">
            {/* File Upload Section */}
            <Card variant="elevated">
              <CardHeader>
                <HStack spacing={2}>
                  <UploadIcon size={20} />
                  <Heading size="md">Select EEG Files</Heading>
                  <Badge colorScheme="blue" ml={2}>Step 1</Badge>
                </HStack>
              </CardHeader>
              <CardBody>
                <FileUpload
                  accept={{
                    'application/octet-stream': ['.edf', '.bdf', '.vhdr', '.set', '.fif', '.cnt', '.npy'],
                  }}
                  maxSize={100 * 1024 * 1024} // 100MB
                  multiple={true}
                  onFilesAccepted={onFilesAccepted}
                  onFileRemove={onFileRemove}
                  acceptedFiles={selectedFiles}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  error={uploadError}
                  disabled={uploadSuccess}
                />
              </CardBody>
            </Card>

            {/* Subject Information */}
            <Card variant="elevated">
              <CardHeader>
                <HStack spacing={2}>
                  <Icons.Patient size={20} />
                  <Heading size="md">Subject Information</Heading>
                  <Badge colorScheme="purple" ml={2}>Step 2</Badge>
                </HStack>
              </CardHeader>
              <CardBody>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                  <GridItem>
                    <FormControl isRequired isInvalid={!!errors.subjectId}>
                      <FormLabel>Subject ID</FormLabel>
                      <Input
                        placeholder="e.g., 001, patient01"
                        {...register('subjectId')}
                      />
                      {errors.subjectId && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {errors.subjectId.message}
                        </Text>
                      )}
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isInvalid={!!errors.subjectAge}>
                      <FormLabel>Age (years)</FormLabel>
                      <Input
                        type="number"
                        placeholder="25"
                        {...register('subjectAge', { valueAsNumber: true })}
                      />
                      {errors.subjectAge && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {errors.subjectAge.message}
                        </Text>
                      )}
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Gender</FormLabel>
                      <Select placeholder="Select gender" {...register('subjectGender')}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </Select>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Group</FormLabel>
                      <Input
                        placeholder="e.g., control, patient, ADHD"
                        {...register('subjectGroup')}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>

            {/* Recording Information */}
            <Card variant="elevated">
              <CardHeader>
                <HStack spacing={2}>
                  <Icons.SignalWave size={20} />
                  <Heading size="md">Recording Information</Heading>
                  <Badge colorScheme="green" ml={2}>Step 3</Badge>
                </HStack>
              </CardHeader>
              <CardBody>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                  <GridItem>
                    <FormControl isRequired isInvalid={!!errors.task}>
                      <FormLabel>Task</FormLabel>
                      <Select {...register('task')}>
                        {taskOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      {errors.task && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {errors.task.message}
                        </Text>
                      )}
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl>
                      <FormLabel>Session</FormLabel>
                      <Select {...register('session')}>
                        {sessionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  <GridItem colSpan={{ base: 1, md: 2 }}>
                    <FormControl>
                      <FormLabel>Acquisition Details</FormLabel>
                      <Input
                        placeholder="e.g., highres, standard, 64ch"
                        {...register('acquisition')}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>

            {/* Additional Notes */}
            <Card variant="elevated">
              <CardHeader>
                <HStack spacing={2}>
                  <Icons.BidsFolder size={20} />
                  <Heading size="md">Additional Information</Heading>
                  <Badge colorScheme="orange" ml={2}>Optional</Badge>
                </HStack>
              </CardHeader>
              <CardBody>
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    placeholder="Any additional information about this recording..."
                    rows={4}
                    {...register('notes')}
                  />
                </FormControl>
              </CardBody>
            </Card>

            {/* Action Buttons */}
            <Card variant="filled">
              <CardBody>
                <HStack justify="space-between" flexWrap="wrap" spacing={4}>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>

                  <HStack spacing={4}>
                    <Button
                      leftIcon={<Save size={20} />}
                      variant="outline"
                      onClick={() => {
                        // Save as draft functionality could go here
                        toast({
                          title: 'Form saved',
                          description: 'Your form data has been saved as draft',
                          status: 'info',
                          duration: 3000,
                          isClosable: true,
                        })
                      }}
                      disabled={isUploading || uploadSuccess}
                    >
                      Save Draft
                    </Button>

                    <Button
                      type="submit"
                      leftIcon={uploadSuccess ? <CheckCircle size={20} /> : <UploadIcon size={20} />}
                      colorScheme={uploadSuccess ? 'green' : 'brand'}
                      isLoading={isUploading}
                      loadingText={`Uploading... ${uploadProgress}%`}
                      disabled={!isValid || selectedFiles.length === 0 || uploadSuccess}
                      size="lg"
                    >
                      {uploadSuccess ? 'Upload Complete' : 'Upload EEG Data'}
                    </Button>
                  </HStack>
                </HStack>
              </CardBody>
            </Card>
          </VStack>
        </form>

        {/* BIDS Information */}
        <Card variant="outline">
          <CardBody>
            <VStack spacing={3} align="start">
              <HStack spacing={2}>
                <Icons.BidsFolder size={20} />
                <Text fontWeight="bold">BIDS Compliance</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                Your data will be automatically organized according to the Brain Imaging Data Structure (BIDS) 
                specification, ensuring compatibility with standard neuroimaging analysis tools and promoting 
                data sharing and reproducibility.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </>
  )
}

export default EegUpload