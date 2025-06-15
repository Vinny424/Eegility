import {
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  Text,
  Drawer,
  DrawerContent,
  useDisclosure,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react'
import { 
  Home, 
  Upload, 
  Brain, 
  FileText, 
  User,
  Activity,
  Database,
  Settings,
  HelpCircle 
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'

interface SidebarProps {
  onClose: () => void
  isOpen: boolean
}

interface NavItemProps {
  icon: any
  href: string
  children: ReactNode
  badge?: string | number
  isComingSoon?: boolean
}

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/dashboard' },
  { name: 'Upload EEG', icon: Upload, href: '/upload' },
  { name: 'ADHD Analysis', icon: Brain, href: '/analysis', isComingSoon: true },
  { name: 'Data Browser', icon: Database, href: '/browse', isComingSoon: true },
  { name: 'Reports', icon: FileText, href: '/reports', isComingSoon: true },
  { name: 'Live Streaming', icon: Activity, href: '/streaming', isComingSoon: true },
  { name: 'Profile', icon: User, href: '/profile' },
  { name: 'Settings', icon: Settings, href: '/settings', isComingSoon: true },
  { name: 'Help', icon: HelpCircle, href: '/help', isComingSoon: true },
]

const NavItem: React.FC<NavItemProps> = ({ icon, href, children, badge, isComingSoon }) => {
  const location = useLocation()
  const isActive = location.pathname === href || location.pathname.startsWith(href + '/')
  
  const activeBg = useColorModeValue('brand.50', 'brand.900')
  const activeColor = useColorModeValue('brand.600', 'brand.200')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')

  return (
    <Box
      as={NavLink}
      to={href}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
      onClick={(e) => {
        if (isComingSoon) {
          e.preventDefault()
        }
      }}
      cursor={isComingSoon ? 'not-allowed' : 'pointer'}
      opacity={isComingSoon ? 0.6 : 1}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : 'inherit'}
        _hover={{
          bg: isComingSoon ? 'transparent' : (isActive ? activeBg : hoverBg),
        }}
        transition="all 0.2s"
      >
        <Icon
          mr="4"
          fontSize="16"
          as={icon}
        />
        <Text fontSize="sm" fontWeight={isActive ? 'medium' : 'normal'}>
          {children}
        </Text>
        {badge && (
          <Badge ml="auto" size="sm" colorScheme="brand">
            {badge}
          </Badge>
        )}
        {isComingSoon && (
          <Badge ml="auto" size="sm" colorScheme="orange" variant="subtle">
            Soon
          </Badge>
        )}
      </Flex>
    </Box>
  )
}

const SidebarContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box
      bg={bg}
      borderRight="1px"
      borderRightColor={borderColor}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      overflowY="auto"
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <HStack spacing={3}>
          <Box
            w={8}
            h={8}
            bg="brand.500"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Brain color="white" size={20} />
          </Box>
          <Text fontSize="xl" fontWeight="bold" color="brand.500">
            EEGility
          </Text>
        </HStack>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>

      <VStack spacing={1} align="stretch" mt={8}>
        {navItems.map((item) => (
          <NavItem
            key={item.name}
            icon={item.icon}
            href={item.href}
            isComingSoon={item.isComingSoon}
          >
            {item.name}
          </NavItem>
        ))}
      </VStack>

      <Box mt={8} mx={6} p={4} bg="brand.50" _dark={{ bg: 'brand.900' }} borderRadius="lg">
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          💡 Need Help?
        </Text>
        <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
          Check out our documentation or contact support for assistance.
        </Text>
      </Box>
    </Box>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      <Box display={{ base: 'none', md: 'block' }}>
        <SidebarContent onClose={() => {}} />
      </Box>
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="xs"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
    </>
  )
}