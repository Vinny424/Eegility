import React from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react'
import { Card, CardBody } from './Card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: React.ComponentType<any>
  change?: {
    value: number
    period: string
    type: 'increase' | 'decrease'
  }
  trend?: {
    data: number[]
    color?: string
  }
  format?: 'number' | 'percentage' | 'currency' | 'bytes'
  color?: string
  isLoading?: boolean
  onClick?: () => void
}

interface CircularStatsCardProps {
  title: string
  value: number
  max: number
  unit?: string
  color?: string
  size?: string
  thickness?: string
  isLoading?: boolean
}

interface TrendStatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ComponentType<any>
  color?: string
  isLoading?: boolean
}

const formatValue = (value: string | number, format?: string) => {
  if (typeof value === 'string') return value
  
  switch (format) {
    case 'percentage':
      return `${value}%`
    case 'currency':
      return `$${value.toLocaleString()}`
    case 'bytes':
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      if (value === 0) return '0 Bytes'
      const i = Math.floor(Math.log(value) / Math.log(1024))
      return `${(value / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    case 'number':
    default:
      return value.toLocaleString()
  }
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  format,
  color = 'brand',
  isLoading = false,
  onClick,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const iconBg = useColorModeValue(`${color}.50`, `${color}.900`)
  const iconColor = useColorModeValue(`${color}.500`, `${color}.200`)

  if (isLoading) {
    return (
      <Card variant="elevated" interactive={!!onClick} onClick={onClick}>
        <CardBody>
          <HStack spacing={4}>
            <Box
              p={3}
              bg={iconBg}
              borderRadius="lg"
              opacity={0.6}
            >
              <Box w={6} h={6} bg="gray.300" borderRadius="md" />
            </Box>
            <VStack align="start" spacing={2} flex={1}>
              <Box h={4} w="40%" bg="gray.300" borderRadius="md" />
              <Box h={6} w="60%" bg="gray.200" borderRadius="md" />
              <Box h={3} w="50%" bg="gray.200" borderRadius="md" />
            </VStack>
          </HStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="elevated" interactive={!!onClick} onClick={onClick}>
      <CardBody>
        <HStack spacing={4}>
          {icon && (
            <Box
              p={3}
              bg={iconBg}
              borderRadius="lg"
              flexShrink={0}
            >
              <Icon as={icon} boxSize={6} color={iconColor} />
            </Box>
          )}
          
          <Stat flex={1}>
            <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">
              {title}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color={iconColor}>
              {formatValue(value, format)}
            </StatNumber>
            {change && (
              <StatHelpText mb={0}>
                <StatArrow type={change.type} />
                {change.value}% from {change.period}
              </StatHelpText>
            )}
          </Stat>
        </HStack>
      </CardBody>
    </Card>
  )
}

export const CircularStatsCard: React.FC<CircularStatsCardProps> = ({
  title,
  value,
  max,
  unit = '',
  color = 'brand',
  size = '80px',
  thickness = '8px',
  isLoading = false,
}) => {
  const percentage = Math.round((value / max) * 100)

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardBody>
          <VStack spacing={4}>
            <CircularProgress
              value={0}
              size={size}
              thickness={thickness}
              color="gray.300"
            />
            <VStack spacing={1}>
              <Box h={4} w="60%" bg="gray.300" borderRadius="md" />
              <Box h={3} w="40%" bg="gray.200" borderRadius="md" />
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="elevated">
      <CardBody>
        <VStack spacing={4}>
          <CircularProgress
            value={percentage}
            size={size}
            thickness={thickness}
            color={`${color}.500`}
            trackColor={useColorModeValue('gray.100', 'gray.700')}
          >
            <CircularProgressLabel fontSize="sm" fontWeight="bold">
              {percentage}%
            </CircularProgressLabel>
          </CircularProgress>
          
          <VStack spacing={1} textAlign="center">
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {title}
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {value.toLocaleString()}{unit} / {max.toLocaleString()}{unit}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

export const TrendStatsCard: React.FC<TrendStatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = 'brand',
  isLoading = false,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return TrendingUp
      case 'down':
        return TrendingDown
      default:
        return null
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'green'
      case 'down':
        return 'red'
      default:
        return 'gray'
    }
  }

  const iconBg = useColorModeValue(`${color}.50`, `${color}.900`)
  const iconColor = useColorModeValue(`${color}.500`, `${color}.200`)

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardBody>
          <VStack align="start" spacing={3}>
            <HStack justify="space-between" w="full">
              <Box h={4} w="50%" bg="gray.300" borderRadius="md" />
              <Box w={8} h={8} bg="gray.300" borderRadius="lg" />
            </HStack>
            <Box h={8} w="70%" bg="gray.200" borderRadius="md" />
            <Box h={3} w="40%" bg="gray.200" borderRadius="md" />
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="elevated">
      <CardBody>
        <VStack align="start" spacing={3}>
          <HStack justify="space-between" w="full">
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {title}
            </Text>
            {icon && (
              <Box
                p={2}
                bg={iconBg}
                borderRadius="lg"
                flexShrink={0}
              >
                <Icon as={icon} boxSize={4} color={iconColor} />
              </Box>
            )}
          </HStack>
          
          <Text fontSize="2xl" fontWeight="bold" color={iconColor}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
          
          <HStack spacing={2}>
            {subtitle && (
              <Text fontSize="sm" color="gray.500">
                {subtitle}
              </Text>
            )}
            {trendValue && (
              <HStack spacing={1}>
                {getTrendIcon() && (
                  <Icon
                    as={getTrendIcon()}
                    boxSize={3}
                    color={`${getTrendColor()}.500`}
                  />
                )}
                <Text
                  fontSize="sm"
                  color={`${getTrendColor()}.500`}
                  fontWeight="medium"
                >
                  {trendValue}
                </Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}