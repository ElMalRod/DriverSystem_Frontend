import { httpClient } from '@/services/http';
import {
  InvoiceResponse,
  InvoiceDetail,
  InvoiceItemResponse,
  PaymentRequest,
  PaymentResponse,
  PaymentDetail
} from '@/entities/product';

// Re-export the interfaces
export type {
  InvoiceResponse,
  InvoiceDetail,
  InvoiceItemResponse,
  PaymentRequest,
  PaymentResponse,
  PaymentDetail
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Invoices API
export async function getInvoicesByUser(userId: number): Promise<InvoiceResponse[]> {
  try {
    const response = await httpClient(`${BASE_URL}/api/invoice/user/${userId}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error getting invoices for user ${userId}:`, error);
    return [];
  }
}

export async function getInvoiceById(invoiceId: number): Promise<InvoiceResponse | null> {
  try {
    const response = await httpClient(`${BASE_URL}/api/invoice/${invoiceId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error getting invoice ${invoiceId}:`, error);
    return null;
  }
}

// Payments API
export async function createPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
  try {
    const response = await httpClient(`${BASE_URL}/api/payment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

export async function getPaymentsByUser(userId: number): Promise<PaymentResponse[]> {
  try {
    // Corregido según la documentación del usuario: GET /api/payment/{userId}
    const response = await httpClient(`${BASE_URL}/api/payment/${userId}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error getting payments for user ${userId}:`, error);
    return [];
  }
}

export async function getPaymentById(paymentId: number): Promise<PaymentResponse | null> {
  try {
    const response = await httpClient(`${BASE_URL}/api/payment/detail/${paymentId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error getting payment ${paymentId}:`, error);
    return null;
  }
}

// Payment Methods API
export interface PaymentMethod {
  id: number;
  code: string;
  name: string;
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await httpClient(`${BASE_URL}/api/payment/method/`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return [];
  }
}

// Función auxiliar para calcular el saldo pendiente correctamente
export function calculateOutstandingBalance(invoice: any, payments: PaymentResponse[]): number {
  const total = invoice.total || 0;
  const paidAmount = payments.reduce((sum, payment) => sum + payment.paymentView.amount, 0);
  return Math.max(0, total - paidAmount);
}
