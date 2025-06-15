import React from 'react'
import {
  Box,
  Grid,
  GridItem,
  Heading,
  HStack,
  VStack,
  Text,
  Button,
  useColorModeValue,
  SimpleGrid,
} from '@chakra-ui/react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload, Brain, Users, Database, TrendingUp } from 'lucide-react'

import { StatsCard, CircularStatsCard, TrendStatsCard } from '@/components/ui/StatsCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Icons } from '@/components/icons'
import { useAuth } from '@/hooks/useAuth'
import { useEegData } from '@/hooks/useEegData'

interface RecentUpload {
  id: string
  filename: string
  uploadDate: string
  size: string
  status: 'completed' | 'processing' | 'failed'
  adhdAnalysis?: 'pending' | 'completed' | 'failed'
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { eegDataList, isLoading } = useEegData()

  const welcomeTime = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Mock data for demonstration
  const recentUploads: RecentUpload[] = [
    {
      id: '1',
      filename: 'patient_001_baseline.edf',
      uploadDate: '2024-01-15 14:30',
      size: '24.5 MB',
      status: 'completed',
      adhdAnalysis: 'completed'
    },
    {
      id: '2',
      filename: 'patient_002_followup.bdf',
      uploadDate: '2024-01-15 13:45',
      size: '18.2 MB',
      status: 'completed',
      adhdAnalysis: 'pending'
    },
    {
      id: '3',
      filename: 'patient_003_baseline.set',
      uploadDate: '2024-01-15 12:15',
      size: '31.8 MB',
      status: 'processing',
      adhdAnalysis: undefined
    }
  ]

  const columns: Column<RecentUpload>[] = [
    {
      key: 'filename',
      header: 'Filename',
      sortable: true,
      render: (value) => (
        <Text fontWeight="medium" color="brand.500">
          {value}
        </Text>
      )
    },
    {
      key: 'uploadDate',
      header: 'Upload Date',
      sortable: true,
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const colors = {
          completed: 'green',
          processing: 'blue',
          failed: 'red'
        }
        return (
          <Text color={`${colors[value as keyof typeof colors]}.500`} fontWeight="medium">
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Text>
        )
      }
    },
    {
      key: 'adhdAnalysis',
      header: 'ADHD Analysis',
      render: (value) => {
        if (!value) return <Text color="gray.400">Not requested</Text>
        const colors = {
          pending: 'orange',
          completed: 'green',
          failed: 'red'
        }
        return (
          <Text color={`${colors[value as keyof typeof colors]}.500`} fontWeight="medium">
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Text>
        )
      }
    }
  ]

  return (
    <>
      <Helmet>
        <title>Dashboard - EEGility</title>
        <meta name="description" content="EEGility dashboard overview" />
      </Helmet>

      <VStack spacing={8} align="stretch">
        {/* Welcome Header */}
        <Box>
          <Heading size="lg" mb={2}>
            {welcomeTime()}, {user?.firstName}! 👋
          </Heading>
          <Text color="gray.600" _dark={{ color: 'gray.400' }}>
            Here's your EEG data analysis overview
          </Text>
        </Box>

        {/* Quick Actions */}
        <Card variant="filled">
          <CardBody>
            <HStack spacing={4} justify="center" flexWrap="wrap">
              <Button
                leftIcon={<Plus size={20} />}
                colorScheme="brand"
                size="lg"
                onClick={() => navigate('/upload')}
              >
                Upload EEG Data
              </Button>
              <Button
                leftIcon={<Icons.ADHDBrain size={20} />}
                variant="outline"
                size="lg"
                onClick={() => navigate('/analysis')}
              >
                View Analysis
              </Button>
              <Button
                leftIcon={<Icons.BidsFolder size={20} />}
                variant="outline"
                size="lg"
                onClick={() => navigate('/browse')}
              >
                Browse Data
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Stats Grid */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
          <GridItem>
            <StatsCard
              title="Total Uploads"
              value={156}
              icon={Upload}
              change={{
                value: 12,
                period: 'last month',
                type: 'increase'
              }}
              color="blue"
              isLoading={isLoading}
            />
          </GridItem>
          
          <GridItem>
            <StatsCard
              title="ADHD Analyses"
              value={89}
              icon={Icons.ADHDBrain}
              change={{
                value: 8,
                period: 'last week',
                type: 'increase'
              }}
              color="purple"
              isLoading={isLoading}
            />
          </GridItem>
          
          <GridItem>
            <StatsCard
              title="Active Patients"
              value={43}
              icon={Users}
              change={{
                value: 3,
                period: 'last week',
                type: 'increase'
              }}
              color="green"
              isLoading={isLoading}
            />
          </GridItem>
          
          <GridItem>
            <StatsCard
              title="Storage Used"
              value={1.2}
              format="bytes"
              icon={Database}
              change={{
                value: 15,
                period: 'last month',
                type: 'increase'
              }}
              color="orange"
              isLoading={isLoading}
            />
          </GridItem>
        </Grid>

        {/* Secondary Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <CircularStatsCard
            title="Analysis Accuracy"
            value={87}
            max={100}
            unit="%"
            color="green"
            isLoading={isLoading}
          />
          
          <TrendStatsCard
            title="Weekly Uploads"
            value={23}
            subtitle="This week"
            trend="up"
            trendValue="+18%"
            icon={TrendingUp}
            color="blue"
            isLoading={isLoading}
          />
          
          <TrendStatsCard
            title="Processing Time"
            value="2.3 min"
            subtitle="Average"
            trend="down"
            trendValue="-12%"
            icon={Icons.SignalWave}
            color="purple"
            isLoading={isLoading}
          />
        </SimpleGrid>

        {/* Recent Activity */}
        <Card variant="elevated">
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Recent Uploads</Heading>
              <Button size="sm" variant="ghost" onClick={() => navigate('/browse')}>
                View All
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <DataTable
              data={recentUploads}
              columns={columns}
              onRowClick={(row) => navigate(`/eeg/${row.id}`)}
              emptyMessage="No recent uploads"
              isLoading={isLoading}
            />
          </CardBody>
        </Card>

        {/* Quick Insights */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
          <GridItem>
            <Card variant="elevated">
              <CardHeader>
                <Heading size="md">Analysis Success Rate</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="start">
                  <HStack justify="space-between" w="full">
                    <Text>ADHD Detection</Text>
                    <Text fontWeight="bold" color="green.500">94.2%</Text>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <Text>Signal Quality</Text>
                    <Text fontWeight="bold" color="blue.500">98.7%</Text>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <Text>Processing Success</Text>
                    <Text fontWeight="bold" color="purple.500">99.1%</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card variant="elevated">
              <CardHeader>
                <Heading size="md">System Status</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="start">
                  <HStack justify="space-between" w="full">
                    <HStack>
                      <Box w={3} h={3} bg="green.500" borderRadius="full" />
                      <Text>ML Model</Text>
                    </HStack>
                    <Text color="green.500" fontWeight="medium">Online</Text>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <HStack>
                      <Box w={3} h={3} bg="green.500" borderRadius="full" />
                      <Text>Database</Text>
                    </HStack>
                    <Text color="green.500" fontWeight="medium">Healthy</Text>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <HStack>
                      <Box w={3} h={3} bg="orange.500" borderRadius="full" />
                      <Text>Processing Queue</Text>
                    </HStack>
                    <Text color="orange.500" fontWeight="medium">3 pending</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </VStack>
    </>
  )
}

export default Dashboard