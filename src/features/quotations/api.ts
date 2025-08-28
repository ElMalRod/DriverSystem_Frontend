import { httpClient } from '@/services/http';
import { 
  Product, 
  ProductCategory, 
  Quotation, 
  QuotationCreateRequest, 
  QuotationStatusRequest,
  QuotationResponse,
  QuotationDetail,
  QuotationItemResponse
} from '@/entities/product';

// Re-export the interfaces
export type { 
  Product, 
  ProductCategory, 
  Quotation, 
  QuotationCreateRequest, 
  QuotationStatusRequest,
  QuotationResponse,
  QuotationDetail,
  QuotationItemResponse
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Products API
export async function getAllProducts(): Promise<Product[]> {
  try {
    const response = await httpClient(`${BASE_URL}/api/products`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const response = await httpClient(`${BASE_URL}/api/products/${id}`);
    return await response.json();
  } catch (error) {
    console.error(`Error getting product ${id}:`, error);
    return null;
  }
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  try {
    const response = await httpClient(`${BASE_URL}/api/ProductCategory/`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error getting product categories:', error);
    throw error;
  }
}

// Quotations API
export async function createQuotation(quotationData: QuotationCreateRequest): Promise<any> {
  try {
    const response = await httpClient(`${BASE_URL}/api/quotation/`, {
      method: 'POST',
      body: JSON.stringify(quotationData)
    });
    return response.json();
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
}

export async function getQuotationById(id: number): Promise<Quotation | null> {
  try {
    const response = await httpClient(`${BASE_URL}/api/quotation/${id}`);
    return await response.json();
  } catch (error) {
    console.error(`Error getting quotation ${id}:`, error);
    return null;
  }
}

export async function updateQuotationStatus(statusData: QuotationStatusRequest): Promise<any> {
  try {
    const response = await httpClient(`${BASE_URL}/api/quotation/status`, {
      method: 'POST',
      body: JSON.stringify(statusData)
    });
    return response.json();
  } catch (error) {
    console.error('Error updating quotation status:', error);
    throw error;
  }
}

export async function getQuotationsByWorkOrder(workOrderId: number): Promise<Quotation[]> {
  try {
    const response = await httpClient(`${BASE_URL}/api/quotation/workOrder/${workOrderId}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error getting quotations for work order ${workOrderId}:`, error);
    return [];
  }
}

export async function getQuotationsByUser(userId: number): Promise<QuotationResponse[]> {
  try {
    const response = await httpClient(`${BASE_URL}/api/quotation/user/${userId}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error getting quotations for user ${userId}:`, error);
    return [];
  }
}

export async function deleteQuotation(id: number): Promise<any> {
  try {
    const response = await httpClient(`${BASE_URL}/api/quotation/${id}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error(`Error deleting quotation ${id}:`, error);
    throw error;
  }
}
