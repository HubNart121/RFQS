import { Timestamp } from 'firebase/firestore'

export type UserRole = 'admin' | 'buyer' | 'viewer'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Timestamp
}

// --- Product ---
export interface Product {
  id: string
  name: string
  sku: string
  unit: string
  imageUrl: string
  imageThumb: string
  description: string
  category: string
  lastPrice: number
  createdAt: Timestamp
}

// --- Supplier ---
export interface Supplier {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  address: string
  taxId: string
  paymentTerms: string
  rating: number
  createdAt: Timestamp
}

// --- Logistics ---
export type LogisticsType = 'land' | 'air' | 'sea' | 'self'

export interface Logistics {
  id: string
  name: string
  type: LogisticsType
  contactPhone: string
  pricePerKg: number
  estimatedDays: number
  isActive: boolean
}

// --- RFQ ---
export type RFQStatus =
  | 'draft'
  | 'issued'
  | 'quotes_received'
  | 'compared'
  | 'converted_to_po'
  | 'cancelled'

export interface RFQItem {
  productId: string
  productName: string
  quantity: number
  unit: string
  imageUrl: string
}

export interface SupplierOffer {
  id: string
  supplierId: string
  supplierName: string
  leadTimeDays: number
  logisticsId: string
  logisticsCost: number
  prices: { productId: string; unitPrice: number }[]
  totalAmount: number
  submittedAt: Timestamp
  notes: string
}

export interface RFQ {
  id: string
  rfqNumber: string
  status: RFQStatus
  title: string
  createdBy: string
  items: RFQItem[]
  targetSupplierIds: string[]
  supplierOffers: SupplierOffer[]
  selectedOfferId: string | null
  dates: {
    issued: Timestamp | null
    deadline: Timestamp | null
    converted: Timestamp | null
  }
  createdAt: Timestamp
}

// --- Purchase Order ---
export type POStatus =
  | 'draft'
  | 'issued'
  | 'confirmed'
  | 'in_production'
  | 'in_transit'
  | 'delivered'
  | 'closed'
  | 'cancelled'

export interface POItem {
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  imageUrl: string
}

export interface POStatusHistoryEntry {
  status: POStatus
  changedBy: string
  changedByEmail: string
  changedAt: Timestamp
  note: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  rfqId: string
  status: POStatus
  supplierId: string
  supplierName: string
  logisticsId: string
  logisticsName: string
  trackingNumber: string
  items: POItem[]
  subtotal: number
  logisticsCost: number
  totalAmount: number
  paymentTerms: string
  notes: string
  createdBy: string
  dates: {
    poIssued: Timestamp | null
    deliveryDue: Timestamp | null
    shipmentDate: Timestamp | null
    expectedDelivery: Timestamp | null
    actualDelivery: Timestamp | null
    closed: Timestamp | null
  }
  statusHistory: POStatusHistoryEntry[]
  createdAt: Timestamp
}

// --- Audit Log ---
export type LogAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'CHANGE_PASSWORD'
  | 'CREATE_RFQ'
  | 'UPDATE_RFQ_STATUS'
  | 'ADD_QUOTE_OFFER'
  | 'CONVERT_RFQ_TO_PO'
  | 'CREATE_PO'
  | 'UPDATE_PO_STATUS'
  | 'ADD_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'ADD_SUPPLIER'
  | 'UPDATE_SUPPLIER'
  | 'DELETE_SUPPLIER'
  | 'DOWNLOAD_DOCUMENT'

export type LogSeverity = 'info' | 'warning' | 'error'
export type LogTargetType = 'rfq' | 'po' | 'supplier' | 'product' | 'auth' | 'logistics'

export interface AuditLog {
  id: string
  timestamp: Timestamp
  userId: string
  userEmail: string
  action: LogAction
  targetId: string
  targetType: LogTargetType
  details: string
  severity: LogSeverity
}

// --- Calendar Event ---
export interface CalendarEvent {
  id: string
  date: Date
  label: string
  type: 'rfq_deadline' | 'po_delivery' | 'po_shipment' | 'po_closed'
  refId: string
  refNumber: string
  status: RFQStatus | POStatus
}
