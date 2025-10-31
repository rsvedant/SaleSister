// Utility functions for dashboard data processing

/**
 * Format number as currency
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format number with commas
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value)
}

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Format date to full readable string
 */
export const formatDateFull = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Get trend indicator (up, down, neutral)
 */
export const getTrendIndicator = (
  change: number
): 'up' | 'down' | 'neutral' => {
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'neutral'
}

/**
 * Calculate average from array of numbers
 */
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

/**
 * Calculate sum from array of numbers
 */
export const calculateSum = (values: number[]): number => {
  return values.reduce((acc, val) => acc + val, 0)
}

/**
 * Get color based on value and thresholds
 */
export const getColorByThreshold = (
  value: number,
  thresholds: { good: number; warning: number }
): 'success' | 'warning' | 'error' => {
  if (value >= thresholds.good) return 'success'
  if (value >= thresholds.warning) return 'warning'
  return 'error'
}

/**
 * Format time duration (minutes to readable format)
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Format rating with stars
 */
export const formatRating = (rating: number): string => {
  return `${rating.toFixed(1)} ⭐`
}

/**
 * Group data by key
 */
export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Sort array by key
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    return 0
  })
}

/**
 * Filter data by date range
 */
export const filterByDateRange = <T extends { date: string }>(
  data: T[],
  startDate: string,
  endDate: string
): T[] => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return data.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= start && itemDate <= end
  })
}

/**
 * Calculate growth rate
 */
export const calculateGrowthRate = (
  current: number,
  previous: number
): { value: number; isPositive: boolean } => {
  const change = calculatePercentageChange(current, previous)
  return {
    value: Math.abs(change),
    isPositive: change >= 0,
  }
}

/**
 * Get top N items from array
 */
export const getTopN = <T>(
  array: T[],
  n: number,
  key: keyof T
): T[] => {
  return sortBy(array, key, 'desc').slice(0, n)
}

/**
 * Calculate moving average
 */
export const calculateMovingAverage = (
  values: number[],
  window: number
): number[] => {
  const result: number[] = []
  
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      result.push(values[i])
    } else {
      const windowValues = values.slice(i - window + 1, i + 1)
      const avg = calculateAverage(windowValues)
      result.push(avg)
    }
  }
  
  return result
}

/**
 * Format large numbers with K, M suffixes
 */
export const formatCompactNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

/**
 * Get date range label
 */
export const getDateRangeLabel = (days: number): string => {
  if (days === 1) return 'Today'
  if (days === 7) return 'Last 7 days'
  if (days === 30) return 'Last 30 days'
  if (days === 90) return 'Last 90 days'
  return `Last ${days} days`
}

/**
 * Calculate percentage of total
 */
export const calculatePercentageOfTotal = (
  value: number,
  total: number
): number => {
  if (total === 0) return 0
  return (value / total) * 100
}

/**
 * Get time of day label
 */
export const getTimeOfDayLabel = (hour: number): string => {
  if (hour < 6) return 'Night'
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  if (hour < 21) return 'Evening'
  return 'Night'
}

/**
 * Format hour to 12-hour format
 */
export const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

/**
 * Get status color class
 */
export const getStatusColor = (
  status: 'success' | 'warning' | 'error' | 'info'
): string => {
  const colors = {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  }
  return colors[status]
}

/**
 * Get badge color class
 */
export const getBadgeColor = (
  status: 'success' | 'warning' | 'error' | 'info'
): string => {
  const colors = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }
  return colors[status]
}
