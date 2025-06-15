import { useState } from 'react'
import {
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Badge,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react'
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  organization: z.string().optional(),
  title: z.string().optional()
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      organization: user?.organization || '',
      title: user?.title || ''
    }
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  })

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true)

    try {
      await updateProfile(data)
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      setIsEditingProfile(false)
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const onPasswordSubmit = async (_data: PasswordFormData) => {
    setIsUpdatingPassword(true)

    try {
      // Simulate password update API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully changed',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      resetPassword()
    } catch (err: any) {
      toast({
        title: 'Password update failed',
        description: err.message || 'Failed to update password',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    resetProfile()
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Profile Settings</Heading>

      <Tabs>
        <TabList>
          <Tab>Profile Information</Tab>
          <Tab>Security</Tab>
          <Tab>Account Activity</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md">Profile Information</Heading>
                  {!isEditingProfile && (
                    <Button
                      leftIcon={<EditIcon />}
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Edit
                    </Button>
                  )}
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={6}>
                  {/* Avatar Section */}
                  <HStack spacing={4}>
                    <Avatar
                      size="xl"
                      name={`${user?.firstName} ${user?.lastName}`}
                      src={user?.avatar}
                    />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xl" fontWeight="semibold">
                        {user?.firstName} {user?.lastName}
                      </Text>
                      <Text color="gray.600">{user?.email}</Text>
                      <Badge colorScheme="green" variant="subtle">
                        Active Account
                      </Badge>
                    </VStack>
                  </HStack>

                  <Divider />

                  {isEditingProfile ? (
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} style={{ width: '100%' }}>
                      <VStack spacing={4}>
                        <HStack spacing={4} width="100%">
                          <FormControl isInvalid={!!profileErrors.firstName}>
                            <FormLabel>First Name</FormLabel>
                            <Input {...registerProfile('firstName')} />
                            <FormErrorMessage>
                              {profileErrors.firstName?.message}
                            </FormErrorMessage>
                          </FormControl>

                          <FormControl isInvalid={!!profileErrors.lastName}>
                            <FormLabel>Last Name</FormLabel>
                            <Input {...registerProfile('lastName')} />
                            <FormErrorMessage>
                              {profileErrors.lastName?.message}
                            </FormErrorMessage>
                          </FormControl>
                        </HStack>

                        <FormControl isInvalid={!!profileErrors.email}>
                          <FormLabel>Email</FormLabel>
                          <Input {...registerProfile('email')} type="email" />
                          <FormErrorMessage>
                            {profileErrors.email?.message}
                          </FormErrorMessage>
                        </FormControl>

                        <HStack spacing={4} width="100%">
                          <FormControl isInvalid={!!profileErrors.organization}>
                            <FormLabel>Organization (Optional)</FormLabel>
                            <Input {...registerProfile('organization')} />
                            <FormErrorMessage>
                              {profileErrors.organization?.message}
                            </FormErrorMessage>
                          </FormControl>

                          <FormControl isInvalid={!!profileErrors.title}>
                            <FormLabel>Title (Optional)</FormLabel>
                            <Input {...registerProfile('title')} />
                            <FormErrorMessage>
                              {profileErrors.title?.message}
                            </FormErrorMessage>
                          </FormControl>
                        </HStack>

                        <HStack spacing={2} justify="end" width="100%">
                          <Button
                            leftIcon={<CloseIcon />}
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            leftIcon={<CheckIcon />}
                            colorScheme="brand"
                            type="submit"
                            isLoading={isUpdatingProfile}
                            loadingText="Updating..."
                          >
                            Save Changes
                          </Button>
                        </HStack>
                      </VStack>
                    </form>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="semibold">Organization:</Text>
                        <Text>{user?.organization || 'Not specified'}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="semibold">Title:</Text>
                        <Text>{user?.title || 'Not specified'}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="semibold">Member since:</Text>
                        <Text>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</Text>
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            {/* Security Settings */}
            <VStack spacing={6} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="md">Change Password</Heading>
                </CardHeader>
                <CardBody>
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                    <VStack spacing={4}>
                      <FormControl isInvalid={!!passwordErrors.currentPassword}>
                        <FormLabel>Current Password</FormLabel>
                        <Input
                          {...registerPassword('currentPassword')}
                          type="password"
                          placeholder="Enter your current password"
                        />
                        <FormErrorMessage>
                          {passwordErrors.currentPassword?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!passwordErrors.newPassword}>
                        <FormLabel>New Password</FormLabel>
                        <Input
                          {...registerPassword('newPassword')}
                          type="password"
                          placeholder="Enter your new password"
                        />
                        <FormErrorMessage>
                          {passwordErrors.newPassword?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!passwordErrors.confirmPassword}>
                        <FormLabel>Confirm New Password</FormLabel>
                        <Input
                          {...registerPassword('confirmPassword')}
                          type="password"
                          placeholder="Confirm your new password"
                        />
                        <FormErrorMessage>
                          {passwordErrors.confirmPassword?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="brand"
                        width="full"
                        isLoading={isUpdatingPassword}
                        loadingText="Updating password..."
                      >
                        Update Password
                      </Button>
                    </VStack>
                  </form>
                </CardBody>
              </Card>

              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold">Security Tips</Text>
                  <Text fontSize="sm">
                    Use a strong password with at least 8 characters, including uppercase and lowercase letters, numbers, and special characters.
                  </Text>
                </VStack>
              </Alert>
            </VStack>
          </TabPanel>

          <TabPanel>
            {/* Account Activity */}
            <Card>
              <CardHeader>
                <Heading size="md">Recent Activity</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text color="gray.600">
                    Account activity and login history would be displayed here...
                  </Text>
                  
                  <Alert status="info">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Activity logging is currently being implemented. This feature will show your recent logins and account changes.
                    </Text>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  )
}

export default Profile