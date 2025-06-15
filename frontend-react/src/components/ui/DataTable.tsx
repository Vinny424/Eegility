import React, { useState, useMemo } from 'react'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  Input,
  Select,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  useColorModeValue,
  Skeleton,
  Box,
  Flex,
  Spacer,
} from '@chakra-ui/react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

export interface Column<T = any> {
  key: string
  header: string
  accessor?: keyof T | ((row: T) => any)
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  minWidth?: string | number
  render?: (value: any, row: T, index: number) => React.ReactNode
}

interface DataTableProps<T = any> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  pageSize?: number
  currentPage?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, string>) => void
  onRowClick?: (row: T, index: number) => void
  onRowSelect?: (selectedRows: T[]) => void
  enableRowSelection?: boolean
  enableGlobalSearch?: boolean
  emptyMessage?: string
  actions?: React.ReactNode
  variant?: 'simple' | 'striped' | 'outline'
}

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <HStack justify="space-between" w="full" flexWrap="wrap" spacing={4}>
      <HStack spacing={2}>
        <Text fontSize="sm" color="gray.600">
          Show
        </Text>
        <Select
          size="sm"
          w="auto"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </Select>
        <Text fontSize="sm" color="gray.600">
          per page
        </Text>
      </HStack>

      <Text fontSize="sm" color="gray.600">
        Showing {startItem} to {endItem} of {totalItems} results
      </Text>

      <HStack spacing={1}>
        <IconButton
          size="sm"
          variant="ghost"
          aria-label="First page"
          icon={<ChevronsLeft size={16} />}
          isDisabled={currentPage === 1}
          onClick={() => onPageChange(1)}
        />
        <IconButton
          size="sm"
          variant="ghost"
          aria-label="Previous page"
          icon={<ChevronLeft size={16} />}
          isDisabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        />

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNumber
          if (totalPages <= 5) {
            pageNumber = i + 1
          } else if (currentPage <= 3) {
            pageNumber = i + 1
          } else if (currentPage >= totalPages - 2) {
            pageNumber = totalPages - 4 + i
          } else {
            pageNumber = currentPage - 2 + i
          }

          return (
            <Button
              key={pageNumber}
              size="sm"
              variant={currentPage === pageNumber ? 'solid' : 'ghost'}
              onClick={() => onPageChange(pageNumber)}
              minW="32px"
            >
              {pageNumber}
            </Button>
          )
        })}

        <IconButton
          size="sm"
          variant="ghost"
          aria-label="Next page"
          icon={<ChevronRight size={16} />}
          isDisabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />
        <IconButton
          size="sm"
          variant="ghost"
          aria-label="Last page"
          icon={<ChevronsRight size={16} />}
          isDisabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
        />
      </HStack>
    </HStack>
  )
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  pageSize = 10,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  onSort,
  onFilter,
  onRowClick,
  onRowSelect,
  enableRowSelection = false,
  enableGlobalSearch = false,
  emptyMessage = 'No data available',
  actions,
  variant = 'simple',
}: DataTableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<T[]>([])
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [globalSearch, setGlobalSearch] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const selectedBg = useColorModeValue('brand.50', 'brand.900')

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return

    const newDirection = 
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    
    setSortColumn(column.key)
    setSortDirection(newDirection)
    onSort(column.key, newDirection)
  }

  const handleRowSelect = (row: T, isSelected: boolean) => {
    let newSelectedRows
    if (isSelected) {
      newSelectedRows = [...selectedRows, row]
    } else {
      newSelectedRows = selectedRows.filter(r => r !== row)
    }
    setSelectedRows(newSelectedRows)
    onRowSelect?.(newSelectedRows)
  }

  const handleSelectAll = (isSelected: boolean) => {
    const newSelectedRows = isSelected ? [...data] : []
    setSelectedRows(newSelectedRows)
    onRowSelect?.(newSelectedRows)
  }

  const isRowSelected = (row: T) => selectedRows.includes(row)
  const isAllSelected = data.length > 0 && selectedRows.length === data.length
  const isIndeterminate = selectedRows.length > 0 && !isAllSelected

  const getCellValue = (row: T, column: Column<T>) => {
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        return column.accessor(row)
      }
      return row[column.accessor]
    }
    return row[column.key]
  }

  const renderCell = (row: T, column: Column<T>, index: number) => {
    const value = getCellValue(row, column)
    
    if (column.render) {
      return column.render(value, row, index)
    }

    // Default rendering based on value type
    if (typeof value === 'boolean') {
      return <Badge colorScheme={value ? 'green' : 'red'}>{value ? 'Yes' : 'No'}</Badge>
    }

    if (value instanceof Date) {
      return value.toLocaleDateString()
    }

    if (typeof value === 'number') {
      return value.toLocaleString()
    }

    return value?.toString() || '-'
  }

  const tableVariant = {
    simple: {},
    striped: { variant: 'striped' },
    outline: { border: '1px solid', borderColor },
  }[variant]

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        {(enableGlobalSearch || actions) && (
          <HStack justify="space-between">
            {enableGlobalSearch && (
              <Skeleton height="40px" width="300px" borderRadius="md" />
            )}
            <Spacer />
            {actions && (
              <Skeleton height="40px" width="200px" borderRadius="md" />
            )}
          </HStack>
        )}
        
        <TableContainer>
          <Table {...tableVariant}>
            <Thead>
              <Tr>
                {enableRowSelection && <Th width="50px" />}
                {columns.map((column) => (
                  <Th key={column.key}>
                    <Skeleton height="20px" />
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {Array.from({ length: pageSize }, (_, i) => (
                <Tr key={i}>
                  {enableRowSelection && (
                    <Td>
                      <Skeleton height="16px" width="16px" />
                    </Td>
                  )}
                  {columns.map((column) => (
                    <Td key={column.key}>
                      <Skeleton height="20px" />
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </VStack>
    )
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Header with search and actions */}
      {(enableGlobalSearch || actions) && (
        <Flex>
          {enableGlobalSearch && (
            <HStack spacing={2} maxW="300px">
              <Search size={16} />
              <Input
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                size="sm"
              />
            </HStack>
          )}
          <Spacer />
          {actions && <Box>{actions}</Box>}
        </Flex>
      )}

      {/* Table */}
      <TableContainer>
        <Table {...tableVariant}>
          <Thead>
            <Tr>
              {enableRowSelection && (
                <Th width="50px">
                  <Checkbox
                    isChecked={isAllSelected}
                    isIndeterminate={isIndeterminate}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </Th>
              )}
              {columns.map((column) => (
                <Th
                  key={column.key}
                  width={column.width}
                  minWidth={column.minWidth}
                  cursor={column.sortable ? 'pointer' : 'default'}
                  onClick={() => handleSort(column)}
                  _hover={column.sortable ? { bg: hoverBg } : {}}
                >
                  <HStack spacing={1}>
                    <Text>{column.header}</Text>
                    {column.sortable && sortColumn === column.key && (
                      <Box>
                        {sortDirection === 'asc' ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )}
                      </Box>
                    )}
                  </HStack>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + (enableRowSelection ? 1 : 0)}>
                  <Text textAlign="center" py={8} color="gray.500">
                    {emptyMessage}
                  </Text>
                </Td>
              </Tr>
            ) : (
              data.map((row, index) => (
                <Tr
                  key={index}
                  cursor={onRowClick ? 'pointer' : 'default'}
                  bg={isRowSelected(row) ? selectedBg : 'transparent'}
                  _hover={onRowClick ? { bg: hoverBg } : {}}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {enableRowSelection && (
                    <Td>
                      <Checkbox
                        isChecked={isRowSelected(row)}
                        onChange={(e) => handleRowSelect(row, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Td>
                  )}
                  {columns.map((column) => (
                    <Td key={column.key} width={column.width} minWidth={column.minWidth}>
                      {renderCell(row, column, index)}
                    </Td>
                  ))}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && onPageSizeChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </VStack>
  )
}