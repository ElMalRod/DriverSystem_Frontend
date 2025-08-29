// Re-export API functions
export {
  getInvoicesByUser,
  getPaymentsByUser,
  createPayment,
  getPaymentById,
  getInvoiceById
} from './api';

// Re-export types
export type {
  InvoiceResponse,
  InvoiceDetail,
  InvoiceItemResponse,
  PaymentRequest,
  PaymentResponse,
  PaymentDetail
} from './api';

// Import types for local use
import type { InvoiceResponse as InvoiceResponseType, PaymentResponse as PaymentResponseType } from './api';

// Re-export types with simpler names for components
export type Invoice = InvoiceResponseType;
export type Payment = PaymentResponseType;
export type PaymentMethod = {
  id: number;
  name: string;
  description?: string;
};

// Mock function for payment methods - should be implemented in API
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  return [
    { id: 1, name: 'Credit Card', description: 'Visa, Mastercard, American Express' },
    { id: 2, name: 'Bank Transfer', description: 'Direct bank transfer' },
    { id: 3, name: 'Cash', description: 'Cash payment' },
    { id: 4, name: 'Check', description: 'Check payment' }
  ];
};