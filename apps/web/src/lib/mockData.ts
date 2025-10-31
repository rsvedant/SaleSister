import type {
  CallMetrics,
  CallVolumeByIntent,
  CallTypeDistribution,
  PeakTimeData,
  ConversionFunnelData,
  ReservationMetrics,
  OrderMetrics,
  ChannelMixData,
  TopMenuItem,
  RevenueByChannel,
  SatisfactionTrend,
  SuccessRateByIntent,
  DashboardData,
} from './dashboard-types'

// Utility function to generate random number in range
const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Utility function to generate random float in range
const randomFloat = (min: number, max: number, decimals: number = 2): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

// Generate dates for the last N days
const generateDates = (days: number): string[] => {
  const dates: string[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

// ========== CALL METRICS ==========

export const generateCallMetrics = (): CallMetrics => {
  const totalCalls = randomInRange(800, 1200)
  const reservation = randomInRange(200, 350)
  const newOrder = randomInRange(250, 400)
  const orderStatus = randomInRange(100, 150)
  const hoursAddress = randomInRange(50, 100)
  const modifyOrder = randomInRange(80, 120)
  const allergyMenu = randomInRange(40, 80)

  return {
    totalCalls,
    callsByIntent: {
      reservation,
      newOrder,
      orderStatus,
      hoursAddress,
      modifyOrder,
      allergyMenu,
    },
    successRate: randomFloat(75, 92),
    conversionRate: randomFloat(65, 85),
    avgSatisfaction: randomFloat(4.2, 4.8, 1),
    transferRate: randomFloat(8, 18),
    transferReasons: [
      {
        reason: 'Payment Issue',
        count: randomInRange(15, 30),
        percentage: randomFloat(25, 35),
      },
      {
        reason: 'Large Party/Catering',
        count: randomInRange(12, 25),
        percentage: randomFloat(20, 30),
      },
      {
        reason: 'Special Requests',
        count: randomInRange(10, 20),
        percentage: randomFloat(15, 25),
      },
      {
        reason: 'Complex Modifications',
        count: randomInRange(8, 18),
        percentage: randomFloat(12, 22),
      },
      {
        reason: 'Technical Issues',
        count: randomInRange(5, 12),
        percentage: randomFloat(8, 15),
      },
    ],
    peakTimes: generatePeakTimes(),
    customerSegmentation: {
      new: randomInRange(300, 450),
      returning: randomInRange(350, 550),
      recontactWithin7Days: randomInRange(150, 250),
    },
  }
}

export const generateCallVolumeByIntent = (): CallVolumeByIntent[] => {
  return [
    {
      intent: 'Reservation',
      count: randomInRange(200, 350),
      fill: 'var(--chart-1)',
    },
    {
      intent: 'New Order',
      count: randomInRange(250, 400),
      fill: 'var(--chart-2)',
    },
    {
      intent: 'Order Status',
      count: randomInRange(100, 150),
      fill: 'var(--chart-3)',
    },
    {
      intent: 'Hours/Address',
      count: randomInRange(50, 100),
      fill: 'var(--chart-4)',
    },
    {
      intent: 'Modify Order',
      count: randomInRange(80, 120),
      fill: 'var(--chart-5)',
    },
  ]
}

export const generateCallTypeDistribution = (): CallTypeDistribution[] => {
  const total = 1000
  const reservation = randomFloat(25, 35)
  const delivery = randomFloat(30, 40)
  const pickup = randomFloat(15, 25)
  const modify = randomFloat(8, 15)
  const allergyMenu = randomFloat(5, 10)
  const hoursAddress = 100 - (reservation + delivery + pickup + modify + allergyMenu)

  return [
    {
      type: 'Reservation',
      value: Math.round((reservation / 100) * total),
      percentage: reservation,
      fill: 'var(--chart-1)',
    },
    {
      type: 'Delivery',
      value: Math.round((delivery / 100) * total),
      percentage: delivery,
      fill: 'var(--chart-2)',
    },
    {
      type: 'Pickup',
      value: Math.round((pickup / 100) * total),
      percentage: pickup,
      fill: 'var(--chart-3)',
    },
    {
      type: 'Modify Order',
      value: Math.round((modify / 100) * total),
      percentage: modify,
      fill: 'var(--chart-4)',
    },
    {
      type: 'Allergy/Menu',
      value: Math.round((allergyMenu / 100) * total),
      percentage: allergyMenu,
      fill: 'var(--chart-5)',
    },
    {
      type: 'Hours/Address',
      value: Math.round((hoursAddress / 100) * total),
      percentage: hoursAddress,
      fill: 'var(--chart-1)',
    },
  ]
}

const generatePeakTimes = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const peakTimes = []

  for (const day of days) {
    for (let hour = 0; hour < 24; hour++) {
      let volume = 0
      // Lunch rush (11am-2pm)
      if (hour >= 11 && hour <= 14) {
        volume = randomInRange(30, 60)
      }
      // Dinner rush (5pm-9pm)
      else if (hour >= 17 && hour <= 21) {
        volume = randomInRange(50, 90)
      }
      // Weekend boost
      else if ((day === 'Saturday' || day === 'Sunday') && hour >= 10 && hour <= 22) {
        volume = randomInRange(20, 50)
      }
      // Off-peak
      else if (hour >= 9 && hour <= 22) {
        volume = randomInRange(5, 20)
      }

      peakTimes.push({ hour, day, volume })
    }
  }

  return peakTimes
}

export const generatePeakTimeHeatmap = (): PeakTimeData[] => {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const data: PeakTimeData[] = []

  hours.forEach((hour) => {
    const hourStr = `${hour.toString().padStart(2, '0')}:00`
    let baseVolume = 0

    // Lunch rush (11am-2pm)
    if (hour >= 11 && hour <= 14) {
      baseVolume = randomInRange(30, 60)
    }
    // Dinner rush (5pm-9pm)
    else if (hour >= 17 && hour <= 21) {
      baseVolume = randomInRange(50, 90)
    }
    // Off-peak
    else if (hour >= 9 && hour <= 22) {
      baseVolume = randomInRange(5, 20)
    }

    data.push({
      hour: hourStr,
      monday: baseVolume + randomInRange(-5, 5),
      tuesday: baseVolume + randomInRange(-5, 5),
      wednesday: baseVolume + randomInRange(-5, 5),
      thursday: baseVolume + randomInRange(-5, 5),
      friday: baseVolume + randomInRange(5, 15), // Weekend boost
      saturday: baseVolume + randomInRange(10, 20),
      sunday: baseVolume + randomInRange(8, 18),
    })
  })

  return data
}

export const generateConversionFunnel = (): ConversionFunnelData[] => {
  const readyToBuy = 500
  const attempted = Math.round(readyToBuy * randomFloat(0.85, 0.95))
  const completed = Math.round(attempted * randomFloat(0.75, 0.90))

  return [
    {
      stage: 'Ready to Buy',
      value: readyToBuy,
      percentage: 100,
      fill: 'var(--chart-1)',
    },
    {
      stage: 'Attempted',
      value: attempted,
      percentage: Math.round((attempted / readyToBuy) * 100),
      fill: 'var(--chart-2)',
    },
    {
      stage: 'Completed',
      value: completed,
      percentage: Math.round((completed / readyToBuy) * 100),
      fill: 'var(--chart-3)',
    },
  ]
}

// ========== RESERVATION METRICS ==========

export const generateReservationMetrics = (): ReservationMetrics => {
  const dates = generateDates(30)
  const byDate = dates.map((date) => ({
    date,
    count: randomInRange(15, 45),
    partySize: randomInRange(2, 6),
  }))

  return {
    total: byDate.reduce((sum, item) => sum + item.count, 0),
    byDate,
    byPartySize: {
      small: randomInRange(200, 300),
      medium: randomInRange(150, 250),
      large: randomInRange(50, 100),
    },
  }
}

export const generateReservationTimeline = (days: number = 30) => {
  const dates = generateDates(days)
  return dates.map((date) => ({
    date,
    small: randomInRange(8, 18), // 1-2 people
    medium: randomInRange(10, 20), // 3-4 people
    large: randomInRange(3, 10), // 5+ people
  }))
}

// ========== ORDER METRICS ==========

export const generateOrderMetrics = (): OrderMetrics => {
  const deliveryCount = randomInRange(400, 600)
  const pickupCount = randomInRange(250, 400)
  const deliveryRevenue = deliveryCount * randomFloat(35, 55)
  const pickupRevenue = pickupCount * randomFloat(25, 40)

  return {
    delivery: {
      count: deliveryCount,
      revenue: Math.round(deliveryRevenue),
      avgOrderValue: Math.round(deliveryRevenue / deliveryCount),
    },
    pickup: {
      count: pickupCount,
      revenue: Math.round(pickupRevenue),
      avgOrderValue: Math.round(pickupRevenue / pickupCount),
      avgPrepTime: randomInRange(15, 25),
    },
    changes: [
      { reason: 'Out of Stock', count: randomInRange(15, 30) },
      { reason: 'Timing Issue', count: randomInRange(10, 25) },
      { reason: 'Customer Mistake', count: randomInRange(8, 20) },
      { reason: 'Special Request', count: randomInRange(5, 15) },
    ],
    cancellations: [
      { reason: 'Out of Stock', count: randomInRange(10, 20) },
      { reason: 'Long Wait Time', count: randomInRange(8, 18) },
      { reason: 'Changed Mind', count: randomInRange(5, 15) },
      { reason: 'Payment Failed', count: randomInRange(3, 10) },
    ],
  }
}

export const generateChannelMix = (): ChannelMixData[] => {
  const phoneOrders = randomInRange(250, 350)
  const directWebOrders = randomInRange(200, 300)
  const doordashOrders = randomInRange(150, 250)
  const uberEatsOrders = randomInRange(120, 200)
  const total = phoneOrders + directWebOrders + doordashOrders + uberEatsOrders

  const phoneRevenue = phoneOrders * randomFloat(35, 50)
  const directWebRevenue = directWebOrders * randomFloat(30, 45)
  const doordashRevenue = doordashOrders * randomFloat(32, 48)
  const uberEatsRevenue = uberEatsOrders * randomFloat(30, 45)

  return [
    {
      channel: 'Phone',
      orders: phoneOrders,
      revenue: Math.round(phoneRevenue),
      percentage: Math.round((phoneOrders / total) * 100),
      fill: 'var(--chart-1)',
    },
    {
      channel: 'Direct Web',
      orders: directWebOrders,
      revenue: Math.round(directWebRevenue),
      percentage: Math.round((directWebOrders / total) * 100),
      fill: 'var(--chart-2)',
    },
    {
      channel: 'DoorDash',
      orders: doordashOrders,
      revenue: Math.round(doordashRevenue),
      percentage: Math.round((doordashOrders / total) * 100),
      fill: 'var(--chart-3)',
    },
    {
      channel: 'Uber Eats',
      orders: uberEatsOrders,
      revenue: Math.round(uberEatsRevenue),
      percentage: Math.round((uberEatsOrders / total) * 100),
      fill: 'var(--chart-4)',
    },
  ]
}

export const generateTopMenuItems = (): TopMenuItem[] => {
  const items = [
    { name: 'Margherita Pizza', category: 'Pizza' },
    { name: 'Pepperoni Pizza', category: 'Pizza' },
    { name: 'Caesar Salad', category: 'Salad' },
    { name: 'Chicken Alfredo', category: 'Pasta' },
    { name: 'Burger & Fries', category: 'Burger' },
    { name: 'Grilled Salmon', category: 'Seafood' },
    { name: 'Pad Thai', category: 'Asian' },
    { name: 'Tacos (3pc)', category: 'Mexican' },
    { name: 'Sushi Platter', category: 'Sushi' },
    { name: 'BBQ Ribs', category: 'BBQ' },
  ]

  const colors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ]

  return items.map((item, index) => {
    const orderCount = randomInRange(50, 150)
    const avgPrice = randomFloat(12, 35)
    return {
      ...item,
      orderCount,
      revenue: Math.round(orderCount * avgPrice),
      fill: colors[index % colors.length],
    }
  })
}

export const generateRevenueByChannel = (days: number = 30): RevenueByChannel[] => {
  const dates = generateDates(days)
  return dates.map((date) => ({
    date,
    phone: randomInRange(800, 1500),
    directWeb: randomInRange(600, 1200),
    doordash: randomInRange(500, 1000),
    uberEats: randomInRange(400, 900),
  }))
}

export const generateSatisfactionTrend = (days: number = 30): SatisfactionTrend[] => {
  const dates = generateDates(days)
  return dates.map((date) => ({
    date,
    rating: randomFloat(4.0, 4.9, 1),
    confidence: randomFloat(0.85, 0.98, 2),
  }))
}

export const generateSuccessRateByIntent = (): SuccessRateByIntent[] => {
  return [
    {
      intent: 'Reservation',
      successRate: randomFloat(85, 95),
      fill: 'var(--chart-1)',
    },
    {
      intent: 'New Order',
      successRate: randomFloat(75, 90),
      fill: 'var(--chart-2)',
    },
    {
      intent: 'Order Status',
      successRate: randomFloat(90, 98),
      fill: 'var(--chart-3)',
    },
    {
      intent: 'Modify Order',
      successRate: randomFloat(70, 85),
      fill: 'var(--chart-4)',
    },
    {
      intent: 'Hours/Address',
      successRate: randomFloat(95, 99),
      fill: 'var(--chart-5)',
    },
  ]
}

// ========== COMPLETE DASHBOARD DATA ==========

export const generateDashboardData = (): DashboardData => {
  return {
    callMetrics: generateCallMetrics(),
    reservationMetrics: generateReservationMetrics(),
    orderMetrics: generateOrderMetrics(),
    channelMix: generateChannelMix(),
    topMenuItems: generateTopMenuItems(),
    revenueByChannel: generateRevenueByChannel(),
    satisfactionTrend: generateSatisfactionTrend(),
    successRateByIntent: generateSuccessRateByIntent(),
  }
}

// Export individual generators for flexibility
export const mockDataGenerators = {
  callVolumeByIntent: generateCallVolumeByIntent,
  callTypeDistribution: generateCallTypeDistribution,
  peakTimeHeatmap: generatePeakTimeHeatmap,
  conversionFunnel: generateConversionFunnel,
  reservationTimeline: generateReservationTimeline,
  channelMix: generateChannelMix,
  topMenuItems: generateTopMenuItems,
  revenueByChannel: generateRevenueByChannel,
  satisfactionTrend: generateSatisfactionTrend,
  successRateByIntent: generateSuccessRateByIntent,
}
