import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  List,
  ListItem,
  Icon,
  useColorModeValue,
  Badge,
  IconButton,
} from '@chakra-ui/react'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { DataUploadIcon } from '@/components/icons'

interface FileUploadProps {
  accept?: Record<string, string[]>
  maxSize?: number
  multiple?: boolean
  onFilesAccepted: (files: File[]) => void
  onFileRemove?: (file: File) => void
  isUploading?: boolean
  uploadProgress?: number
  error?: string
  disabled?: boolean
  acceptedFiles?: File[]
}

interface FileItemProps {
  file: File
  onRemove?: (file: File) => void
  isUploading?: boolean
  progress?: number
  error?: string
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  onRemove,
  isUploading = false,
  progress = 0,
  error,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = () => {
    if (error) return <AlertCircle size={16} color="red" />
    if (isUploading) return <Upload size={16} color="blue" />
    if (progress === 100) return <CheckCircle size={16} color="green" />
    return <File size={16} />
  }

  const getStatusColor = () => {
    if (error) return 'red'
    if (isUploading) return 'blue'
    if (progress === 100) return 'green'
    return 'gray'
  }

  return (
    <Box
      p={3}
      border="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      borderRadius="md"
      bg={useColorModeValue('white', 'gray.700')}
    >
      <HStack justify="space-between" align="start">
        <HStack flex={1} spacing={3}>
          {getStatusIcon()}
          <VStack align="start" spacing={1} flex={1}>
            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
              {file.name}
            </Text>
            <HStack spacing={2}>
              <Text fontSize="xs" color="gray.500">
                {formatFileSize(file.size)}
              </Text>
              <Badge size="sm" colorScheme={getStatusColor()}>
                {error ? 'Error' : isUploading ? 'Uploading' : progress === 100 ? 'Complete' : 'Ready'}
              </Badge>
            </HStack>
            {isUploading && (
              <Box w="full">
                <Progress value={progress} size="sm" colorScheme="blue" hasStripe isAnimated />
              </Box>
            )}
            {error && (
              <Text fontSize="xs" color="red.500">
                {error}
              </Text>
            )}
          </VStack>
        </HStack>
        
        {onRemove && !isUploading && (
          <IconButton
            size="sm"
            variant="ghost"
            colorScheme="red"
            aria-label="Remove file"
            icon={<X size={14} />}
            onClick={() => onRemove(file)}
          />
        )}
      </HStack>
    </Box>
  )
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = {
    'application/octet-stream': ['.edf', '.bdf', '.vhdr', '.set', '.fif', '.cnt', '.npy'],
  },
  maxSize = 100 * 1024 * 1024, // 100MB
  multiple = false,
  onFilesAccepted,
  onFileRemove,
  isUploading = false,
  uploadProgress = 0,
  error,
  disabled = false,
  acceptedFiles = [],
}) => {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setDragActive(false)
      onFilesAccepted(acceptedFiles)
    },
    [onFilesAccepted]
  )

  const onDragEnter = useCallback(() => {
    setDragActive(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept,
    maxSize,
    multiple,
    disabled: disabled || isUploading,
  })

  const dropzoneBg = useColorModeValue('gray.50', 'gray.800')
  const dropzoneBgActive = useColorModeValue('brand.50', 'brand.900')
  const dropzoneBorder = useColorModeValue('gray.300', 'gray.600')
  const dropzoneBorderActive = useColorModeValue('brand.300', 'brand.600')

  const formatAcceptedTypes = () => {
    const extensions = Object.values(accept).flat()
    return extensions.join(', ')
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Dropzone */}
      <Box
        {...getRootProps()}
        p={8}
        border="2px dashed"
        borderColor={isDragActive || dragActive ? dropzoneBorderActive : dropzoneBorder}
        borderRadius="lg"
        bg={isDragActive || dragActive ? dropzoneBgActive : dropzoneBg}
        textAlign="center"
        cursor={disabled || isUploading ? 'not-allowed' : 'pointer'}
        transition="all 0.2s ease-in-out"
        _hover={!disabled && !isUploading ? {
          borderColor: dropzoneBorderActive,
          bg: dropzoneBgActive,
        } : {}}
        opacity={disabled || isUploading ? 0.6 : 1}
      >
        <input {...getInputProps()} />
        <VStack spacing={4}>
          <Icon
            as={DataUploadIcon}
            boxSize={12}
            color={isDragActive || dragActive ? 'brand.500' : 'gray.400'}
          />
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="medium">
              {isDragActive || dragActive
                ? 'Drop files here'
                : 'Drag & drop files here, or click to select'}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Supported formats: {formatAcceptedTypes()}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Maximum file size: {Math.round(maxSize / (1024 * 1024))}MB
            </Text>
          </VStack>
          {!isDragActive && !dragActive && (
            <Button size="sm" variant="outline" disabled={disabled || isUploading}>
              Select Files
            </Button>
          )}
        </VStack>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Upload Error:</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <AlertTitle>Some files were rejected:</AlertTitle>
            <List spacing={1}>
              {fileRejections.map(({ file, errors }) => (
                <ListItem key={file.name} fontSize="sm">
                  <Text as="span" fontWeight="medium">
                    {file.name}
                  </Text>
                  : {errors.map((e) => e.message).join(', ')}
                </ListItem>
              ))}
            </List>
          </VStack>
        </Alert>
      )}

      {/* Accepted Files */}
      {acceptedFiles.length > 0 && (
        <VStack spacing={3} align="stretch">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            {acceptedFiles.length} file{acceptedFiles.length > 1 ? 's' : ''} selected:
          </Text>
          {acceptedFiles.map((file, index) => (
            <FileItem
              key={`${file.name}-${index}`}
              file={file}
              onRemove={onFileRemove}
              isUploading={isUploading}
              progress={uploadProgress}
              error={error}
            />
          ))}
        </VStack>
      )}

      {/* Overall Upload Progress */}
      {isUploading && (
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">
              Uploading...
            </Text>
            <Text fontSize="sm" color="gray.500">
              {uploadProgress}%
            </Text>
          </HStack>
          <Progress value={uploadProgress} colorScheme="brand" hasStripe isAnimated />
        </Box>
      )}
    </VStack>
  )
}