import { Outlet } from 'react-router-dom'
import {
  Box,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export const Layout: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bg = useColorModeValue('gray.50', 'gray.900')

  return (
    <Box minH="100vh" bg={bg}>
      <Sidebar
        onClose={onClose}
        isOpen={isOpen}
      />
      <Box ml={{ base: 0, md: 60 }} transition="margin-left 0.3s">
        <Navbar onMenuClick={onOpen} />
        <Box as="main" p={{ base: 4, md: 8 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}