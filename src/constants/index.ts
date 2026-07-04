import type { Property, PropertyData, PropertyId, UploadItem } from '@/types'

export const APP_NAME = 'Heritage Solar'

export const ROUTES = {
  home: '/',
  bill: '/bill',
  history: '/history',
  analytics: '/analytics',
  admin: '/admin',
} as const

export const PROPERTIES: Property[] = [
  { id: 'home', label: 'Home', shortLabel: 'Home' },
  { id: 'heritage', label: 'Heritage Building', shortLabel: 'Heritage' },
]

export const PROPERTY_DATA: Record<PropertyId, PropertyData> = {
  home: {
    bill: {
      month: 'June 2026',
      amountDue: 2840,
      dueDate: '2026-07-15',
      status: 'published',
      currency: '₹',
    },
    savings: {
      savedThisMonth: 4120,
      lifetimeSavings: 48650,
      currency: '₹',
    },
    quickStats: [
      {
        id: 'generation',
        label: 'Solar Generated',
        value: '428 kWh',
        trend: '+12%',
        trendUp: true,
      },
      {
        id: 'consumption',
        label: 'Consumed',
        value: '312 kWh',
        trend: '-4%',
        trendUp: false,
      },
      {
        id: 'export',
        label: 'Exported',
        value: '116 kWh',
        trend: '+18%',
        trendUp: true,
      },
      {
        id: 'efficiency',
        label: 'Efficiency',
        value: '94.2%',
        trend: '+2%',
        trendUp: true,
      },
    ],
    breakdown: {
      generation: 428,
      gridImport: 94,
      export: 116,
      consumption: 312,
      energyCharge: 3120,
      discount: 820,
      fixedCharge: 540,
      total: 2840,
      currency: '₹',
      unit: 'kWh',
    },
    history: [
      { id: 'h1', month: 'June 2026', status: 'published', amount: 2840, currency: '₹' },
      { id: 'h2', month: 'May 2026', status: 'published', amount: 3120, currency: '₹' },
      { id: 'h3', month: 'April 2026', status: 'published', amount: 2680, currency: '₹' },
      { id: 'h4', month: 'March 2026', status: 'published', amount: 3450, currency: '₹' },
      { id: 'h5', month: 'February 2026', status: 'published', amount: 2980, currency: '₹' },
      { id: 'h6', month: 'January 2026', status: 'published', amount: 3210, currency: '₹' },
    ],
    monthlyBills: [
      { month: 'Jan', value: 3210 },
      { month: 'Feb', value: 2980 },
      { month: 'Mar', value: 3450 },
      { month: 'Apr', value: 2680 },
      { month: 'May', value: 3120 },
      { month: 'Jun', value: 2840 },
    ],
    monthlyConsumption: [
      { month: 'Jan', value: 340 },
      { month: 'Feb', value: 318 },
      { month: 'Mar', value: 365 },
      { month: 'Apr', value: 298 },
      { month: 'May', value: 332 },
      { month: 'Jun', value: 312 },
    ],
    monthlySavings: [
      { month: 'Jan', value: 3800 },
      { month: 'Feb', value: 4100 },
      { month: 'Mar', value: 3650 },
      { month: 'Apr', value: 4520 },
      { month: 'May', value: 3980 },
      { month: 'Jun', value: 4120 },
    ],
    solarGeneration: [
      { month: 'Jan', value: 390 },
      { month: 'Feb', value: 410 },
      { month: 'Mar', value: 445 },
      { month: 'Apr', value: 480 },
      { month: 'May', value: 455 },
      { month: 'Jun', value: 428 },
    ],
  },
  heritage: {
    bill: {
      month: 'June 2026',
      amountDue: 9650,
      dueDate: '2026-07-18',
      status: 'published',
      currency: '₹',
    },
    savings: {
      savedThisMonth: 12840,
      lifetimeSavings: 142300,
      currency: '₹',
    },
    quickStats: [
      {
        id: 'generation',
        label: 'Solar Generated',
        value: '1,240 kWh',
        trend: '+9%',
        trendUp: true,
      },
      {
        id: 'consumption',
        label: 'Consumed',
        value: '980 kWh',
        trend: '-2%',
        trendUp: false,
      },
      {
        id: 'export',
        label: 'Exported',
        value: '260 kWh',
        trend: '+14%',
        trendUp: true,
      },
      {
        id: 'efficiency',
        label: 'Efficiency',
        value: '91.8%',
        trend: '+1%',
        trendUp: true,
      },
    ],
    breakdown: {
      generation: 1240,
      gridImport: 210,
      export: 260,
      consumption: 980,
      energyCharge: 11200,
      discount: 2480,
      fixedCharge: 930,
      total: 9650,
      currency: '₹',
      unit: 'kWh',
    },
    history: [
      { id: 'b1', month: 'June 2026', status: 'published', amount: 9650, currency: '₹' },
      { id: 'b2', month: 'May 2026', status: 'published', amount: 10240, currency: '₹' },
      { id: 'b3', month: 'April 2026', status: 'published', amount: 8890, currency: '₹' },
      { id: 'b4', month: 'March 2026', status: 'published', amount: 11120, currency: '₹' },
      { id: 'b5', month: 'February 2026', status: 'published', amount: 9740, currency: '₹' },
      { id: 'b6', month: 'January 2026', status: 'published', amount: 10580, currency: '₹' },
    ],
    monthlyBills: [
      { month: 'Jan', value: 10580 },
      { month: 'Feb', value: 9740 },
      { month: 'Mar', value: 11120 },
      { month: 'Apr', value: 8890 },
      { month: 'May', value: 10240 },
      { month: 'Jun', value: 9650 },
    ],
    monthlyConsumption: [
      { month: 'Jan', value: 1020 },
      { month: 'Feb', value: 960 },
      { month: 'Mar', value: 1080 },
      { month: 'Apr', value: 910 },
      { month: 'May', value: 1010 },
      { month: 'Jun', value: 980 },
    ],
    monthlySavings: [
      { month: 'Jan', value: 11800 },
      { month: 'Feb', value: 12450 },
      { month: 'Mar', value: 10920 },
      { month: 'Apr', value: 13600 },
      { month: 'May', value: 12110 },
      { month: 'Jun', value: 12840 },
    ],
    solarGeneration: [
      { month: 'Jan', value: 1180 },
      { month: 'Feb', value: 1210 },
      { month: 'Mar', value: 1290 },
      { month: 'Apr', value: 1340 },
      { month: 'May', value: 1275 },
      { month: 'Jun', value: 1240 },
    ],
  },
}

export const RECENT_UPLOADS: UploadItem[] = [
  {
    id: '1',
    fileName: 'meter_reading_june_2026.pdf',
    uploadedAt: '2026-07-01T10:24:00Z',
    status: 'processed',
  },
  {
    id: '2',
    fileName: 'meter_reading_may_2026.pdf',
    uploadedAt: '2026-06-02T09:12:00Z',
    status: 'processed',
  },
  {
    id: '3',
    fileName: 'meter_reading_april_2026.pdf',
    uploadedAt: '2026-05-03T14:45:00Z',
    status: 'processed',
  },
]
