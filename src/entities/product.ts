export interface Product {
  id: number;
  name: string;
  brand: string;
  categoryId: number;
  categoryName?: string;
  unit: string;
  taxable: boolean;
  cost: number;
  price: number;
  active: boolean;
  service: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface QuotationItem {
  productId: number;
  quantity: number;
}

export interface QuotationCreateRequest {
  workOrderId: number;
  approveBy: number;
  item: QuotationItem[];
}

export interface QuotationStatusRequest {
  id: number;
  statusId: number;
}

// Interfaces basadas en la estructura real del API
export interface QuotationDetail {
  id: number;
  code: string;
  workOrderId: number;
  status: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy: number;
  customerId: number;
}

export interface QuotationItemResponse {
  quotation: number;
  quantity: number;
  product_id: number;
  name: string;
  brand: string;
  unit: string;
  price: number;
  categoria: string;
}

export interface QuotationResponse {
  quotation: QuotationDetail;
  itemResponse: QuotationItemResponse[];
}

// Interfaces para crear cotizaciones (se mantienen)
export interface Quotation {
  id: number;
  workOrderId: number;
  approveBy: number;
  status?: string;
  total?: number;
  createdAt?: string;
  items?: QuotationItemDetail[];
}

export interface QuotationItemDetail {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Interfaces para facturas e invoices
export interface InvoiceDetail {
  id: number;
  code: string;
  type: string;
  quotation_id: number;
  goodsReceiptId?: number | null;
  userId: number;
  issueDate: string;
  dueDate?: string | null;
  status: string;
  currency: string;
  notes?: string;
  total: number;
  outstandingBalance?: number | null;
}

export interface InvoiceItem {
  id: {
    quotationId: number;
    productId: number;
  };
  quantity: number;
  name: string;
  brand: string;
  unit: string;
  price: number;
  categoria: string;
  subtotal: number;
}

export interface InvoiceResponse {
  invoice: InvoiceDetail;
  item: InvoiceItem[];
}

// Interfaces para pagos
export interface PaymentRequest {
  invoice: number;
  methodId: number;
  amount: number;
  reference?: string;
}

export interface PaymentView {
  id: number;
  userId: number;
  amount: number;
  paid_at: string;
  reference?: string;
  payment_method: string;
  invoiceId: number;
}

export interface PaymentResponse {
  paymentView: PaymentView;
  invoice: InvoiceResponse;
}

export interface PaymentDetail {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  status: string;
}
