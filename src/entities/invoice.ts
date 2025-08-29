export interface Invoice {
  id: number;
  code: string;
  userId: number;
  workOrderId?: number;
  status: 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';
  total: number;
  paid: number;
  pending: number;
  createdAt: string;
  dueDate?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  productId: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
}

export interface Payment {
  id: number;
  invoiceId: number;
  userId: number;
  method: string;
  amount: number;
  paidAt: string;
  reference?: string;
}

export interface PaymentMethod {
  id: number;
  code: string;
  name: string;
}

export interface PaymentRequest {
  invoice: number;
  methodId: number;
  amount: number;
  reference?: string;
}
