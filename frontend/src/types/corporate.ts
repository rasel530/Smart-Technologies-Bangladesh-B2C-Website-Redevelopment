// Corporate Account Types

export enum CorporateStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED'
}

export enum CorporateUserRole {
  CORPORATE_ADMIN = 'CORPORATE_ADMIN',
  REQUESTER = 'REQUESTER',
  APPROVER = 'APPROVER'
}

export enum POStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum CreditRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface CorporateRegistrationData {
  // User Information
  userId?: string;
  
  // Company Information
  companyName: string;
  companyRegistrationNumber: string;
  tinNumber?: string;
  businessAddress: string;
  division: string;
  district: string;
  upazila?: string;
  postalCode?: string;
  
  // Authorized Person Information
  authorizedPersonName: string;
  authorizedPersonEmail: string;
  authorizedPersonPhone: string;
  companyEmail: string;
  
  // Documents
  documents?: {
    tradeLicense?: File;
    tinCertificate?: File;
    vatCertificate?: File;
  };
  
  // Terms
  termsAccepted: boolean;
}

export interface CorporateAccount {
  id: string;
  userId: string;
  companyName: string;
  companyRegistrationNumber: string;
  tinNumber?: string;
  businessAddress: string;
  division: string;
  district: string;
  upazila?: string;
  postalCode?: string;
  authorizedPersonName: string;
  authorizedPersonEmail: string;
  authorizedPersonPhone: string;
  companyEmail: string;
  status: CorporateStatus;
  creditLimit: number;
  usedCredit: number;
  accountManagerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CorporateAccountStatus {
  accountId: string;
  status: CorporateStatus;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  pendingApprovals: number;
  activeUsers: number;
  totalOrders: number;
  totalSpent: number;
}

export interface CorporateUser {
  id: string;
  accountId: string;
  userId: string;
  role: CorporateUserRole;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email?: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface CorporatePricing {
  specialPrice: number;
  discountPercent: number;
  validFrom: string;
  validTo: string;
}

export interface CorporateProduct {
  id: string;
  name: string;
  nameBn?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  regularPrice: number;
  salePrice: number;
  corporatePricing?: CorporatePricing;
  image?: string;
  sku?: string;
}

export interface PurchaseOrder {
  id: string;
  accountId: string;
  poNumber: string;
  requesterId: string;
  approverId?: string;
  totalAmount: number;
  status: POStatus;
  notes?: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  items: PurchaseOrderItem[];
  createdBy?: string;
  subtotal?: number;
  vatAmount?: number;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface CreatePurchaseOrderData {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  notes?: string;
  document?: File;
}

export interface Invoice {
  id: string;
  accountId: string;
  invoiceNumber: string;
  purchaseOrderId?: string;
  poNumber?: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  subtotal?: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  invoiceDate?: string;
  pdfUrl?: string;
}

export interface CreditLimit {
  accountId: string;
  creditLimit: number;
  limit: number;
  usedCredit: number;
  availableCredit: number;
  lastUpdated: string;
  creditScore?: number;
}

export interface CreditRequest {
  id: string;
  accountId: string;
  requestedBy: string;
  currentLimit: number;
  requestedLimit: number;
  requestedAmount: number;
  reason: string;
  status: CreditRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  approvedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditRequestData {
  requestedLimit: number;
  reason: string;
}

export interface CorporateDashboardStats {
  accountStatus: CorporateStatus;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  pendingApprovals: number;
  recentOrders: PurchaseOrder[];
  pendingInvoices: Invoice[];
}

export interface Notification {
  id: string;
  accountId: string;
  type: 'ORDER' | 'INVOICE' | 'CREDIT' | 'USER' | 'SYSTEM';
  title: string;
  titleBn?: string;
  message: string;
  messageBn?: string;
  isRead: boolean;
  createdAt: string;
}

// API Response Types (these are the data payloads, not the full API response)
export interface CorporateRegistrationResponse {
  accountId: string;
  status: CorporateStatus;
}
