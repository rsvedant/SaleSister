// Dashboard Data Types

export interface CallMetrics {
  totalCalls: number
  callsByIntent: {
    reservation: number
    newOrder: number
    orderStatus: number
    hoursAddress: number
    modifyOrder: number
    allergyMenu: number
  }
  successRate: number
  conversionRate: number
  avgSatisfaction: number
  transferRate: number
  transferReasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
  peakTimes: Array<{
    hour: number
    day: string
    volume: number
  }>
  customerSegmentation: {
    new: number
    returning: number
    recontactWithin7Days: number
  }
}

export interface CallVolumeByIntent {
  intent: string
  count: number
  fill: string
}

export interface CallTypeDistribution {
  type: string
  value: number
  percentage: number
  fill: string
}

export interface PeakTimeData {
  hour: string
  monday: number
  tuesday: number
  wednesday: number
  thursday: number
  friday: number
  saturday: number
  sunday: number
}

export interface ConversionFunnelData {
  stage: string
  value: number
  percentage: number
  fill: string
}

export interface ReservationMetrics {
  total: number
  byDate: Array<{
    date: string
    count: number
    partySize: number
  }>
  byPartySize: {
    small: number // 1-2 people
    medium: number // 3-4 people
    large: number // 5+ people
  }
}

export interface OrderMetrics {
  delivery: {
    count: number
    revenue: number
    avgOrderValue: number
  }
  pickup: {
    count: number
    revenue: number
    avgOrderValue: number
    avgPrepTime: number // in minutes
  }
  changes: Array<{
    reason: string
    count: number
  }>
  cancellations: Array<{
    reason: string
    count: number
  }>
}

export interface ChannelMixData {
  channel: string
  orders: number
  revenue: number
  percentage: number
  fill: string
}

export interface TopMenuItem {
  name: string
  category: string
  orderCount: number
  revenue: number
  fill: string
}

export interface RevenueByChannel {
  date: string
  phone: number
  directWeb: number
  doordash: number
  uberEats: number
}

export interface SatisfactionTrend {
  date: string
  rating: number
  confidence: number
}

export interface SuccessRateByIntent {
  intent: string
  successRate: number
  fill: string
}

export interface DashboardData {
  callMetrics: CallMetrics
  reservationMetrics: ReservationMetrics
  orderMetrics: OrderMetrics
  channelMix: ChannelMixData[]
  topMenuItems: TopMenuItem[]
  revenueByChannel: RevenueByChannel[]
  satisfactionTrend: SatisfactionTrend[]
  successRateByIntent: SuccessRateByIntent[]
}

export interface DateRange {
  from: Date
  to: Date
}

export interface FilterOptions {
  dateRange: DateRange
  channel?: string
  intent?: string
}
