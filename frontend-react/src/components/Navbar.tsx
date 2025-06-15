import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  useColorMode,
  Avatar,
  Text,
  Badge,
} from '@chakra-ui/react'
import { Menu as MenuIcon, Sun, Moon, LogOut, User, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

interface NavbarProps {
  onMenuClick: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate()
  const { colorMode, toggleColorMode } = useColorMode()
  const { user, logout } = useAuth()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  return (
    <Box
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      px={{ base: 4, md: 8 }}
      py={4}
      shadow="sm"
    >
      <Flex alignItems="center" justifyContent="space-between">
        <HStack spacing={4}>
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onMenuClick}
            variant="ghost"
            aria-label="Open menu"
            icon={<MenuIcon size={20} />}
          />
          
          <Box display={{ base: 'none', md: 'block' }}>
            <Text fontSize="lg" fontWeight="bold" color="brand.500">
              EEGility
            </Text>
          </Box>
        </HStack>

        <HStack spacing={4}>
          <IconButton
            size="md"
            fontSize="lg"
            aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
            variant="ghost"
            color="current"
            onClick={toggleColorMode}
            icon={colorMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          />

          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              cursor="pointer"
              minW={0}
              p={2}
            >
              <HStack spacing={3}>
                <Avatar size="sm" name={`${user?.firstName} ${user?.lastName}`} />
                <Box display={{ base: 'none', md: 'block' }} textAlign="left">
                  <Text fontSize="sm" fontWeight="medium">
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <HStack spacing={2}>
                    <Text fontSize="xs" color="gray.500">
                      {user?.role}
                    </Text>
                    {user?.isActive && (
                      <Badge size="sm" colorScheme="green">
                        Active
                      </Badge>
                    )}
                  </HStack>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <Box px={4} py={2}>
                <Text fontWeight="medium">{user?.firstName} {user?.lastName}</Text>
                <Text fontSize="sm" color="gray.500">
                  {user?.email}
                </Text>
                {user?.institution && (
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    {user.institution}
                  </Text>
                )}
              </Box>
              <MenuDivider />
              <MenuItem icon={<User size={16} />} onClick={handleProfile}>
                Profile
              </MenuItem>
              <MenuItem icon={<Settings size={16} />}>
                Settings
              </MenuItem>
              <MenuDivider />
              <MenuItem 
                icon={<LogOut size={16} />} 
                onClick={handleLogout}
                color="red.500"
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  )
}