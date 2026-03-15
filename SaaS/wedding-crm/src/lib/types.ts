export type UserRole = 'ADMIN' | 'RELATIONSHIP_MANAGER' | 'VENDOR_COORDINATOR' | 'CLIENT'

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type WeddingStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  { value: 'WON', label: 'Won', color: 'bg-green-100 text-green-800' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-100 text-red-800' },
]

export const LEAD_SOURCES = ['Website', 'Instagram', 'Referral', 'Wedding Fair', 'Google', 'Facebook', 'Walk-in', 'Other']

export const VENDOR_CATEGORIES = [
  'PHOTOGRAPHER', 'VIDEOGRAPHER', 'CATERER', 'DECORATOR', 'DJ', 'MAKEUP_ARTIST',
  'MEHENDI_ARTIST', 'VENUE', 'FLORIST', 'INVITATION', 'TRANSPORT', 'LIGHTING',
  'ENTERTAINMENT', 'PANDIT', 'CHOREOGRAPHER', 'OTHER'
]

export const WEDDING_FUNCTIONS = [
  'Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception',
  'Cocktail Party', 'Engagement', 'Ring Ceremony', 'Phera',
  'Vidaai', 'Welcome Dinner', 'After Party'
]

export const PRICE_RANGES = ['BUDGET', 'MODERATE', 'PREMIUM', 'LUXURY']

export const DATA_LIBRARY_CATEGORIES = [
  'VENUE_INFO', 'PRICING_GUIDE', 'CHECKLIST_TEMPLATE', 'VENDOR_GUIDE',
  'TREND', 'FAQ', 'INSPIRATION', 'CONTRACT_TEMPLATE', 'POLICY'
]
