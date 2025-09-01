"use client";

import { useEffect, useState } from "react";
import {
  FaFileInvoiceDollar,
  FaCalculator,
  FaThumbsUp,
  FaThumbsDown,
  FaDollarSign,
  FaHistory,
  FaClock,
  FaCheckCircle,
  FaTimes,
  FaExclamationTriangle,
  FaLightbulb,
  FaCreditCard,
  FaUniversity,
  FaClipboard,
  FaStickyNote,
  FaMoneyBillWave,
  FaCreditCard as FaCreditCardIcon,
  FaMoneyCheck,
  FaRedo,
  FaCheck,
  FaFileInvoice,
  FaDownload
} from "react-icons/fa";
import { getSessionUser } from "@/utils/session";
import {
  getQuotationsByUser,
  updateQuotationStatus,
  QuotationResponse,
  QuotationStatusRequest,
  QuotationItemResponse
} from "@/features/quotations/api";
import {
  getInvoicesByUser,
  createPayment,
  getPaymentsByUser,
  InvoiceResponse,
  PaymentRequest,
  PaymentResponse,
  getPaymentMethods,
  PaymentMethod
} from "@/features/invoices/api";
import { downloadInvoicePDF } from "@/utils/invoicePDF";
import type { InvoiceItem } from "@/entities/product";

declare global {
  interface Window {
    Swal: any;
  }
}

// Helper function para calcular el total de una cotización
function calculateQuotationTotal(items: QuotationItemResponse[]): number {
  return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
}

// Componente para mostrar cotizaciones pendientes
function QuotationsSection({
  quotations,
  loading,
  onApprove,
  onReject
}: {
  quotations: QuotationResponse[];
  loading: boolean;
  onApprove: (quotation: QuotationResponse) => Promise<void>;
  onReject: (quotation: QuotationResponse) => Promise<void>;
}) {
  const pendingQuotations = quotations.filter(q => q.quotation.status === 'DRAFT' || q.quotation.status === 'SENT');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando cotizaciones...</span>
        </div>
      </div>
    );
  }

  if (pendingQuotations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <FaFileInvoiceDollar className="text-green-600 mr-3" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Cotizaciones Pendientes</h3>
        </div>
        <div className="text-center py-8">
          <FaFileInvoiceDollar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No hay cotizaciones pendientes de aprobación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <FaFileInvoiceDollar className="text-green-600 mr-3" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">
          Cotizaciones Pendientes ({pendingQuotations.length})
        </h3>
      </div>

      <div className="space-y-4">
        {pendingQuotations.map((quotationResponse) => {
          const quotation = quotationResponse.quotation;
          const items = quotationResponse.itemResponse;
          const total = calculateQuotationTotal(items);

          return (
            <div key={quotation.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FaCalculator className="text-orange-600 mr-2" size={16} />
                    <h4 className="font-semibold text-orange-900">
                      Cotización {quotation.code}
                    </h4>
                    <span className="ml-2 px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-xs">
                      {quotation.status === 'DRAFT' ? 'Pendiente' : quotation.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Orden de Trabajo:</span> #{quotation.workOrderId}</p>
                      <p><span className="font-medium">Fecha:</span> {new Date(quotation.createdAt).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Total Estimado:</span>
                        <span className="text-lg font-bold text-green-600 ml-1">
                          ${total.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {items && items.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-sm text-gray-700 mb-2">Productos/Servicios:</p>
                      <div className="bg-white rounded-md p-3">
                        {items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-1">
                            <div className="flex-1">
                              <span className="text-sm font-medium">{item.name}</span>
                              <span className="text-xs text-gray-500 block">{item.brand} - {item.categoria}</span>
                            </div>
                            <span className="text-sm font-medium">
                              {item.quantity} {item.unit} × ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                  <button
                    onClick={() => onApprove(quotationResponse)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FaThumbsUp size={14} />
                    Aprobar
                  </button>
                  <button
                    onClick={() => onReject(quotationResponse)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FaThumbsDown size={14} />
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente para mostrar facturas pendientes de pago
function InvoicesSection({
  invoices,
  payments,
  loading,
  onMakePayment,
  onDownloadInvoice
}: {
  invoices: InvoiceResponse[];
  payments: PaymentResponse[];
  loading: boolean;
  onMakePayment: (invoice: InvoiceResponse) => Promise<void>;
  onDownloadInvoice: (invoice: InvoiceResponse) => Promise<void>;
}) {
  const pendingInvoices = invoices.filter(inv => {
    const invoice = inv.invoice;
    // Calcular outstandingBalance correctamente
    let outstandingBalance = invoice.outstandingBalance ?? 0;
    
    // Para facturas ISSUED con outstandingBalance = 0, asumir que no han sido pagadas
    if (invoice.status === 'ISSUED' && outstandingBalance === 0) {
      outstandingBalance = invoice.total ?? 0;
    }

    // Una factura está pendiente si:
    // 1. Está en estado ISSUED (recién emitida - siempre pendiente)
    // 2. Está en estado PARTIALLY_PAID y tiene saldo pendiente
    // 3. O cualquier factura que no esté completamente pagada
    const isPending = invoice.status === 'ISSUED' ||
                      (invoice.status === 'PARTIALLY_PAID' && outstandingBalance > 0) ||
                      (invoice.status !== 'PAID' && outstandingBalance > 0);

    return isPending;
  });

  console.log(`[INVOICES] Total invoices: ${invoices.length}, Pending invoices: ${pendingInvoices.length}`);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando facturas...</span>
        </div>
      </div>
    );
  }

  if (pendingInvoices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <FaFileInvoiceDollar className="text-green-600 mr-3" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Facturas Pendientes</h3>
        </div>
        <div className="text-center py-8">
          <FaFileInvoiceDollar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No hay facturas pendientes de pago</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <FaFileInvoiceDollar className="text-green-600 mr-3" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">
          Facturas Pendientes ({pendingInvoices.length})
        </h3>
      </div>

      <div className="space-y-4">
        {pendingInvoices.map((invoiceResponse) => {
          const invoice = invoiceResponse.invoice;
          const items = invoiceResponse.item;
          const total = invoice.total;
          // Calcular outstandingBalance correctamente
          let outstandingBalance = invoice.outstandingBalance ?? 0;
          
          // Para facturas ISSUED con outstandingBalance = 0, asumir que no han sido pagadas
          if (invoice.status === 'ISSUED' && outstandingBalance === 0) {
            outstandingBalance = invoice.total ?? 0;
          }
          
          const paidAmount = total - outstandingBalance;

          return (
            <div key={invoice.id} className={`border rounded-lg p-4 ${
              invoice.status === 'PAID'
                ? 'border-green-200 bg-green-50'
                : invoice.status === 'ISSUED'
                  ? 'border-orange-200 bg-orange-50'
                  : invoice.status === 'PARTIALLY_PAID'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FaFileInvoiceDollar className={`mr-2 text-${
                      invoice.status === 'PAID'
                        ? 'green'
                        : invoice.status === 'ISSUED'
                          ? 'orange'
                          : invoice.status === 'PARTIALLY_PAID'
                            ? 'yellow'
                            : 'red'
                    }-600`} size={16} />
                    <h4 className={`font-semibold text-${
                      invoice.status === 'PAID'
                        ? 'green'
                        : invoice.status === 'ISSUED'
                          ? 'orange'
                          : invoice.status === 'PARTIALLY_PAID'
                            ? 'yellow'
                            : 'red'
                    }-900`}>
                      Factura {invoice.code}
                    </h4>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      invoice.status === 'PAID'
                        ? 'bg-green-200 text-green-800'
                        : invoice.status === 'ISSUED'
                          ? 'bg-orange-200 text-orange-800'
                          : invoice.status === 'PARTIALLY_PAID'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-red-200 text-red-800'
                    }`}>
                      {invoice.status === 'PAID'
                        ? 'Pagada'
                        : invoice.status === 'ISSUED'
                          ? 'Emitida - Pendiente de Pago'
                          : invoice.status === 'PARTIALLY_PAID' && outstandingBalance > 0
                            ? 'Pago Parcial - Pendiente de Pago'
                            : invoice.status === 'PARTIALLY_PAID' && outstandingBalance === 0
                              ? 'Pagada'
                              : invoice.status || 'Pendiente'
                      }
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Fecha de Emisión:</span> {new Date(invoice.issueDate).toLocaleDateString('es-ES')}</p>
                      {invoice.dueDate && (
                        <p><span className="font-medium">Vencimiento:</span> {new Date(invoice.dueDate).toLocaleDateString('es-ES')}</p>
                      )}
                      <p><span className="font-medium">Moneda:</span> {invoice.currency}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Total:</span>
                        <span className="text-lg font-bold text-gray-900 ml-1">
                          ${total.toFixed(2)} {invoice.currency}
                        </span>
                      </p>
                      <p><span className="font-medium">Pagado:</span>
                        <span className="text-green-600 ml-1">
                          ${paidAmount.toFixed(2)} {invoice.currency}
                        </span>
                      </p>
                      <p><span className="font-medium">Pendiente:</span>
                        <span className="text-red-600 font-bold ml-1">
                          ${outstandingBalance.toFixed(2)} {invoice.currency}
                        </span>
                      </p>
                    </div>
                  </div>

                  {invoice.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notas:</span> {invoice.notes}
                      </p>
                    </div>
                  )}

                  {items && items.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-sm text-gray-700 mb-2">Productos/Servicios:</p>
                      <div className="bg-white rounded-md p-3">
                        {items.map((item, index) => (
                          <div key={`${item.id.quotationId}-${item.id.productId}`} className="flex justify-between items-center py-1">
                            <div className="flex-1">
                              <span className="text-sm font-medium">{item.name}</span>
                              <span className="text-xs text-gray-500 block">{item.brand} - {item.categoria}</span>
                            </div>
                            <span className="text-sm font-medium">
                              {item.quantity} {item.unit} × ${item.price.toFixed(2)} = ${item.subtotal.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                  {/* Botón de descarga PDF */}
                  <button
                    onClick={() => onDownloadInvoice(invoiceResponse)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FaDownload size={14} />
                    Descargar PDF
                  </button>

                  {/* Mostrar botón de pago para facturas con saldo pendiente */}
                  {(() => {
                    // Calcular outstandingBalance correctamente
                    let outstandingBalance = invoice.outstandingBalance ?? 0;

                    // Para facturas ISSUED con outstandingBalance = 0, asumir que no han sido pagadas
                    if (invoice.status === 'ISSUED' && outstandingBalance === 0) {
                      outstandingBalance = invoice.total ?? 0;
                    }

                    // Mostrar botón si está en estado ISSUED o PARTIALLY_PAID con saldo pendiente
                    const shouldShow = invoice.status === 'ISSUED' ||
                                      (invoice.status === 'PARTIALLY_PAID' && outstandingBalance > 0) ||
                                      (invoice.status !== 'PAID' && outstandingBalance > 0);
                    console.log(`[INVOICES] Button for ${invoice.code}: shouldShow=${shouldShow}, status=${invoice.status}, outstanding=${outstandingBalance}, total=${invoice.total}`);

                    return shouldShow && (
                      <button
                        onClick={() => onMakePayment(invoiceResponse)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <FaDollarSign size={14} />
                        Pagar
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente para mostrar historial de pagos
function PaymentsSection({
  payments,
  loading
}: {
  payments: PaymentResponse[];
  loading: boolean;
}) {
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);

  const handleDownloadInvoice = async (paymentResponse: PaymentResponse) => {
    setDownloadingInvoice(paymentResponse.paymentView.id);
    try {
      const invoice = paymentResponse.invoice;
      // Preparar los datos de la factura para el PDF
      const invoiceData = {
        id: invoice.invoice.id,
        code: invoice.invoice.code,
        createdAt: invoice.invoice.issueDate,
        status: 'PAID', // En el historial de pagos, estas facturas están pagadas
        totalAmount: invoice.invoice.total,
        pendingAmount: 0, // Ya están pagadas
        items: invoice.item.map(item => ({
          id: item.id.quotationId || 0,
          description: `${item.name} - ${item.brand} (${item.categoria})`,
          quantity: item.quantity,
          price: item.price,
          total: item.subtotal
        })),
        customerName: 'Cliente',
        customerEmail: '',
        customerPhone: ''
      };

      await downloadInvoicePDF(invoiceData);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      alert('Error al descargar la factura. Por favor, inténtalo de nuevo.');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando pagos...</span>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <FaHistory className="text-blue-600 mr-3" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Historial de Pagos</h3>
        </div>
        <div className="text-center py-8">
          <FaHistory className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No hay pagos registrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <FaHistory className="text-blue-600 mr-3" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">
          Historial de Pagos ({payments.length})
        </h3>
      </div>

      <div className="space-y-4">
        {payments.map((paymentResponse) => {
          const payment = paymentResponse.paymentView;
          const invoice = paymentResponse.invoice.invoice;

          return (
            <div key={payment.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FaDollarSign className="text-green-600 mr-2" size={16} />
                    <h4 className="font-semibold text-gray-900">
                      Pago - Factura {invoice.code}
                    </h4>
                    <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                      Completado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Fecha de Pago:</span> {new Date(payment.paid_at).toLocaleDateString('es-ES')}</p>
                      <p><span className="font-medium">Método:</span> {payment.payment_method}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Monto Pagado:</span>
                        <span className="text-lg font-bold text-green-600 ml-1">
                          ${payment.amount.toFixed(2)}
                        </span>
                      </p>
                      {payment.reference && (
                        <p><span className="font-medium">Referencia:</span> {payment.reference}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleDownloadInvoice(paymentResponse)}
                    disabled={downloadingInvoice === payment.id}
                    className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {downloadingInvoice === payment.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <FaDownload className="mr-2" size={14} />
                        Descargar PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [quotations, setQuotations] = useState<QuotationResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotationsLoading, setQuotationsLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(user);
    setLoading(false);

    if (user?.id) {
      loadUserQuotations(user.id);
      loadUserInvoices(user.id);
      loadUserPayments(user.id);
    }
  }, []);

  async function loadUserQuotations(userId: string | number) {
    try {
      console.log("[INVOICES] Loading quotations for user:", userId);
      setQuotationsLoading(true);

      const userQuotations = await getQuotationsByUser(Number(userId));
      console.log("[INVOICES] Quotations loaded:", userQuotations);
      setQuotations(userQuotations);

    } catch (err: any) {
      console.error("[INVOICES] Error loading quotations:", err);
      setQuotations([]);
    } finally {
      setQuotationsLoading(false);
    }
  }

  async function loadUserInvoices(userId: string | number) {
    try {
      console.log("[INVOICES] Loading invoices for user:", userId);
      setInvoicesLoading(true);

      const userInvoices = await getInvoicesByUser(Number(userId));
      console.log("[INVOICES] Invoices loaded:", userInvoices.length, "invoices");
      setInvoices(userInvoices);

    } catch (err: any) {
      console.error("[INVOICES] Error loading invoices:", err);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }

  async function loadUserPayments(userId: string | number) {
    try {
      console.log("[INVOICES] Loading payments for user:", userId);
      setPaymentsLoading(true);

      // Nota: Verificar si este endpoint existe en la API
      const userPayments = await getPaymentsByUser(Number(userId));
      console.log("[INVOICES] Payments loaded:", userPayments);
      setPayments(userPayments);

    } catch (err: any) {
      console.error("[INVOICES] Error loading payments:", err);
      // Si es error 404, significa que el endpoint no existe, mostrar array vacío sin error
      if (err.message?.includes('404') || err.status === 404) {
        console.log("[INVOICES] Payments endpoint not available, showing empty payments list");
        setPayments([]);
      } else {
        // Para otros errores, mostrar array vacío pero loggear el error
        console.warn("[INVOICES] Unexpected error loading payments, showing empty list");
        setPayments([]);
      }
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function handleApproveQuotation(quotationResponse: QuotationResponse) {
    if (!currentUser?.id) return;

    const quotation = quotationResponse.quotation;
    const items = quotationResponse.itemResponse;
    const total = calculateQuotationTotal(items);

    try {
      if (window.Swal) {
        const result = await window.Swal.fire({
          title: '¿Aprobar Cotización?',
          html: `
            <div class="text-left">
              <p class="mb-3">¿Estás seguro de que deseas aprobar esta cotización?</p>
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <p class="text-sm font-medium text-green-800">Al aprobar:</p>
                <ul class="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Se iniciará el trabajo con los productos/servicios cotizados</li>
                  <li>• El técnico podrá continuar con la orden de trabajo</li>
                  <li>• Total estimado: $${total.toFixed(2)}</li>
                  <li>• Productos: ${items.map(i => i.name).join(', ')}</li>
                </ul>
              </div>
            </div>
          `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Sí, Aprobar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          const statusRequest: QuotationStatusRequest = {
            id: quotation.id,
            statusId: 3 // APPROVED - Aprobada
          };

          await updateQuotationStatus(statusRequest);
          await loadUserQuotations(currentUser.id);
          await loadUserInvoices(currentUser.id); // Recargar facturas después de aprobar cotización

          window.Swal.fire({
            icon: 'success',
            title: '¡Cotización Aprobada!',
            text: 'La cotización ha sido aprobada. Se ha generado la factura correspondiente y el técnico puede continuar con el trabajo.',
            confirmButtonColor: '#10B981'
          });
        }
      }
    } catch (error) {
      console.error('Error approving quotation:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo aprobar la cotización. Intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  async function handleRejectQuotation(quotationResponse: QuotationResponse) {
    if (!currentUser?.id) return;

    const quotation = quotationResponse.quotation;
    const items = quotationResponse.itemResponse;
    const total = calculateQuotationTotal(items);

    try {
      if (window.Swal) {
        const { value: rejectionReason } = await window.Swal.fire({
          title: '¿Rechazar Cotización?',
          html: `
            <div class="text-left space-y-4">
              <p class="text-gray-700">¿Estás seguro de que deseas rechazar esta cotización?</p>
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <p class="text-sm font-medium text-red-800">Al rechazar:</p>
                <ul class="text-sm text-red-700 mt-2 space-y-1">
                  <li>• Se cancelará esta propuesta de servicios</li>
                  <li>• El técnico deberá crear una nueva cotización</li>
                  <li>• Total cotizado: $${total.toFixed(2)}</li>
                  <li>• Productos: ${items.map(i => i.name).join(', ')}</li>
                </ul>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Motivo del rechazo (opcional):</label>
                <textarea id="swal-rejection-reason" class="w-full p-3 border border-gray-300 rounded-lg" rows="3" placeholder="Escribe el motivo por el que rechazas la cotización..."></textarea>
              </div>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#EF4444',
          cancelButtonColor: '#6B7280',
          confirmButtonText: 'Sí, Rechazar',
          cancelButtonText: 'Cancelar',
          focusConfirm: false,
          preConfirm: () => {
            const reason = (document.getElementById('swal-rejection-reason') as HTMLTextAreaElement).value;
            return reason.trim() || 'Sin motivo especificado';
          }
        });

        if (rejectionReason) {
          const statusRequest: QuotationStatusRequest = {
            id: quotation.id,
            statusId: 4 // REJECTED - Rechazada
          };

          await updateQuotationStatus(statusRequest);
          await loadUserQuotations(currentUser.id);

          window.Swal.fire({
            icon: 'success',
            title: 'Cotización Rechazada',
            text: 'La cotización ha sido rechazada. El técnico será notificado.',
            confirmButtonColor: '#10B981'
          });
        }
      }
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo rechazar la cotización. Intenta nuevamente.',
          confirmButtonColor: '#EF4444'
        });
      }
    }
  }

  async function handleMakePayment(invoiceResponse: InvoiceResponse) {
    if (!currentUser?.id) return;

    const invoice = invoiceResponse.invoice;
    const items = invoiceResponse.item;

    // Calcular outstandingBalance correctamente
    let outstandingBalance = invoice.outstandingBalance;

    // CORRECCIÓN TEMPORAL: Si outstandingBalance es 0 pero la factura no está marcada como pagada,
    // asumir que es un error del backend y usar el total como pendiente
    if (outstandingBalance === 0 && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED') {
      outstandingBalance = invoice.total ?? 0;
    }
    // Si es null/undefined, usar total como pendiente (factura nueva)
    else if (outstandingBalance === null || outstandingBalance === undefined) {
      outstandingBalance = invoice.total ?? 0;
    }

    const paidAmount = invoice.total - outstandingBalance;

    try {
      // Obtener métodos de pago disponibles
      const paymentMethods = await getPaymentMethods();

      if (window.Swal) {
        // Crear opciones del select dinámicamente con íconos
        const methodOptions = paymentMethods.map(method => {
          const icon = method.code === 'CASH' ? '<i class="fas fa-money-bill-wave"></i>' :
                      method.code === 'CARD' ? '<i class="fas fa-credit-card"></i>' :
                      method.code === 'TRANSFER' ? '<i class="fas fa-university"></i>' :
                      method.code === 'CHECK' ? '<i class="fas fa-money-check"></i>' : '<i class="fas fa-dollar-sign"></i>';
          return `<option value="${method.code}">${icon} ${method.name}</option>`;
        }).join('');

        const { value: paymentData } = await window.Swal.fire({
          title: '<i class="fas fa-credit-card mr-2"></i>Realizar Pago',
          html: `
            <div class="text-left space-y-4 max-w-lg mx-auto">
              <!-- Información de la factura -->
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-file-invoice text-blue-600 text-lg"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-blue-900">Factura ${invoice.code}</h3>
                    <p class="text-sm text-blue-700">Fecha: ${new Date(invoice.issueDate).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>

                <!-- Resumen de montos -->
                <div class="grid grid-cols-3 gap-3 text-center">
                  <div class="bg-white p-3 rounded-lg border">
                    <p class="text-xs text-gray-600 uppercase tracking-wide">Total</p>
                    <p class="text-lg font-bold text-gray-900">$${invoice.total.toFixed(2)}</p>
                  </div>
                  <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p class="text-xs text-green-700 uppercase tracking-wide">Pagado</p>
                    <p class="text-lg font-bold text-green-800">$${paidAmount.toFixed(2)}</p>
                  </div>
                  <div class="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p class="text-xs text-orange-700 uppercase tracking-wide">Pendiente</p>
                    <p class="text-lg font-bold text-orange-800">$${outstandingBalance.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <!-- Formulario de pago -->
              <div class="space-y-4">
                <!-- Monto a pagar -->
                <div>
                  <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-dollar-sign text-green-600"></i>
                    Monto a Pagar (${invoice.currency})
                  </label>
                  <div class="relative">
                    <input
                      type="number"
                      id="swal-payment-amount"
                      class="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-lg font-semibold"
                      placeholder="0.00"
                      min="0.01"
                      max="${outstandingBalance}"
                      step="0.01"
                      value="${outstandingBalance}"
                    >
                    <span class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                      ${invoice.currency}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    Máximo: $${outstandingBalance.toFixed(2)} | Mínimo: $0.01
                  </p>
                </div>

                <!-- Método de pago -->
                <div>
                  <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-university text-blue-600"></i>
                    Método de Pago
                  </label>
                  <select
                    id="swal-payment-method"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                  >
                    <option value="">Selecciona un método de pago</option>
                    ${methodOptions}
                  </select>
                </div>

                <!-- Referencia (opcional) -->
                <div>
                  <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-clipboard text-purple-600"></i>
                    Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    id="swal-payment-reference"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Número de comprobante, transferencia, etc."
                  >
                </div>

                <!-- Notas (opcional) -->
                <div>
                  <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-sticky-note text-indigo-600"></i>
                    Notas (Opcional)
                  </label>
                  <textarea
                    id="swal-payment-notes"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                    rows="2"
                    placeholder="Notas adicionales sobre el pago..."
                  ></textarea>
                </div>
              </div>

              <!-- Información importante -->
              <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div class="flex items-start gap-2">
                  <i class="fas fa-exclamation-triangle text-amber-600 mt-0.5"></i>
                  <div class="text-sm">
                    <p class="font-medium text-amber-800">Información Importante:</p>
                    <p class="text-amber-700 mt-1">
                      Si pagas menos del total pendiente, la factura permanecerá como "Emitida - Pendiente de Pago"
                      hasta que completes el pago total.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          `,
          icon: 'info',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#6B7280',
          confirmButtonText: '<i class="fas fa-credit-card mr-2"></i>Procesar Pago',
          cancelButtonText: '<i class="fas fa-times mr-2"></i>Cancelar',
          focusConfirm: false,
          width: '600px',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'text-white font-semibold py-3 px-6 rounded-xl transition-all hover:scale-105',
            cancelButton: 'font-semibold py-3 px-6 rounded-xl transition-all hover:scale-105'
          },
          preConfirm: () => {
            const amountInput = document.getElementById('swal-payment-amount') as HTMLInputElement;
            const methodSelect = document.getElementById('swal-payment-method') as HTMLSelectElement;
            const referenceInput = document.getElementById('swal-payment-reference') as HTMLInputElement;
            const notesTextarea = document.getElementById('swal-payment-notes') as HTMLTextAreaElement;

            const amount = parseFloat(amountInput.value);
            const method = methodSelect.value;
            const reference = referenceInput.value.trim();
            const notes = notesTextarea.value.trim();

            if (!amount || amount <= 0) {
              window.Swal.showValidationMessage('<i class="fas fa-dollar-sign mr-1"></i>Ingresa un monto válido mayor a 0');
              return false;
            }

            if (amount > outstandingBalance) {
              window.Swal.showValidationMessage('<i class="fas fa-exclamation-triangle mr-1"></i>El monto no puede ser mayor al pendiente');
              return false;
            }

            if (!method) {
              window.Swal.showValidationMessage('<i class="fas fa-university mr-1"></i>Selecciona un método de pago');
              return false;
            }

            return {
              amount,
              method,
              reference: reference || undefined,
              notes: notes || undefined
            };
          }
        });

        if (paymentData) {
          // Mostrar loading
          window.Swal.fire({
            title: '<i class="fas fa-clock mr-2"></i>Procesando Pago...',
            html: `
              <div class="text-center py-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-green-500 mx-auto mb-4"></div>
                <p class="text-gray-600">Estamos procesando tu pago de <strong>$${paymentData.amount.toFixed(2)}</strong></p>
                <p class="text-sm text-gray-500 mt-2">Por favor espera un momento...</p>
              </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              window.Swal.showLoading();
            }
          });

          // Encontrar methodId
          const selectedMethod = paymentMethods.find(method => method.code === paymentData.method);
          const methodId = selectedMethod ? selectedMethod.id : 1;

          // Validar y convertir amount a número
          const amountValue = parseFloat(paymentData.amount.toString());
          if (isNaN(amountValue) || amountValue <= 0) {
            throw new Error('Monto inválido');
          }

          // Validar que el monto no exceda el saldo pendiente
          if (amountValue > outstandingBalance) {
            throw new Error(`El monto no puede ser mayor al pendiente ($${outstandingBalance.toFixed(2)})`);
          }

          // Validar que invoice.id existe y es un número
          if (!invoice.id || typeof invoice.id !== 'number') {
            throw new Error('ID de factura inválido');
          }

          // Validar que methodId existe y es un número
          if (!methodId || typeof methodId !== 'number') {
            throw new Error('Método de pago inválido');
          }

          const paymentRequest: PaymentRequest = {
            invoice: invoice.id,
            methodId: methodId,
            amount: amountValue,
            reference: paymentData.reference || null // Asegurar que no sea undefined
          };

          console.log('Enviando payment request:', paymentRequest);
          console.log('Validaciones:', {
            invoiceId: invoice.id,
            methodId: methodId,
            amount: amountValue,
            reference: paymentData.reference
          });

          await createPayment(paymentRequest);

          // Recargar datos
          await loadUserInvoices(currentUser.id);
          await loadUserPayments(currentUser.id);

          // Determinar mensaje de éxito
          const isFullPayment = paymentData.amount >= outstandingBalance;
          const successTitle = isFullPayment ? '<i class="fas fa-check-circle mr-2"></i>¡Pago Completado!' : '<i class="fas fa-check mr-2"></i>¡Pago Parcial Registrado!';
          const successMessage = isFullPayment
            ? `Se ha completado el pago total de la factura. ¡Gracias por tu pago!`
            : `Se ha registrado tu pago parcial de $${paymentData.amount.toFixed(2)}. Quedan $${(outstandingBalance - paymentData.amount).toFixed(2)} pendientes.`;

          window.Swal.fire({
            title: successTitle,
            html: `
              <div class="text-center py-4">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-check text-3xl text-green-600"></i>
                </div>
                <p class="text-gray-700 mb-3">${successMessage}</p>
                <div class="bg-gray-50 p-3 rounded-lg text-sm">
                  <p><strong>Factura:</strong> ${invoice.code}</p>
                  <p><strong>Monto Pagado:</strong> $${paymentData.amount.toFixed(2)} ${invoice.currency}</p>
                  <p><strong>Método:</strong> ${selectedMethod?.name || paymentData.method}</p>
                  ${paymentData.reference ? `<p><strong>Referencia:</strong> ${paymentData.reference}</p>` : ''}
                </div>
                ${!isFullPayment ? `
                  <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                    <p class="text-orange-800 text-sm">
                      <strong><i class="fas fa-lightbulb mr-1"></i>Recuerda:</strong> La factura permanecerá pendiente hasta completar el pago total.
                    </p>
                  </div>
                ` : ''}
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#10B981',
            confirmButtonText: '<i class="fas fa-check mr-2"></i>Entendido',
            width: '500px',
            customClass: {
              popup: 'rounded-2xl'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error making payment:', error);

      // Cerrar el loading si está abierto
      if (window.Swal) {
        window.Swal.close();
      }

      if (window.Swal) {
        let errorMessage = 'No se pudo procesar el pago. Por favor intenta nuevamente.';
        let errorTitle = '<i class="fas fa-times mr-2"></i>Error en el Pago';

        // Manejar errores específicos
        if (error instanceof Error) {
          if (error.message.includes('Monto inválido')) {
            errorMessage = 'El monto especificado no es válido.';
          } else if (error.message.includes('Invoice is already fully paid')) {
            errorMessage = 'Esta factura ya está completamente pagada.';
            errorTitle = '<i class="fas fa-info-circle mr-2"></i>Factura Ya Pagada';
          } else if (error.message.includes('Cannot read field "scale"')) {
            errorMessage = 'Error en el procesamiento del monto. Verifica que el valor sea correcto.';
          }
        }

        window.Swal.fire({
          title: errorTitle,
          html: `
            <div class="text-center py-4">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-times text-3xl text-red-600"></i>
              </div>
              <p class="text-gray-700 mb-3">${errorMessage}</p>
              <p class="text-sm text-gray-500">Si el problema persiste, contacta al administrador.</p>
            </div>
          `,
          icon: 'error',
          confirmButtonColor: '#EF4444',
          confirmButtonText: '<i class="fas fa-redo mr-2"></i>Intentar de Nuevo',
          width: '450px',
          customClass: {
            popup: 'rounded-2xl'
          }
        });
      }
    }
  }

  // Función para descargar factura en PDF
  const handleDownloadInvoice = async (invoiceResponse: InvoiceResponse) => {
    try {
      // Mostrar loading
      window.Swal.fire({
        title: '<i class="fas fa-file-pdf mr-2"></i>Generando PDF...',
        html: `
          <div class="text-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Estamos generando tu factura en PDF</p>
            <p class="text-sm text-gray-500 mt-2">Por favor espera un momento...</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          window.Swal.showLoading();
        }
      });

      // Convertir InvoiceResponse a InvoiceData
      const invoiceData = {
        id: invoiceResponse.invoice.id,
        code: invoiceResponse.invoice.code,
        createdAt: invoiceResponse.invoice.issueDate,
        status: invoiceResponse.invoice.status,
        totalAmount: invoiceResponse.invoice.total,
        pendingAmount: invoiceResponse.invoice.outstandingBalance || 0,
        items: invoiceResponse.item.map(item => ({
          id: item.id.quotationId, // Usar quotationId como ID único
          description: `${item.name} - ${item.brand}`,
          quantity: item.quantity,
          price: item.price,
          total: item.subtotal
        })),
        customerName: currentUser?.name || 'Cliente',
        customerEmail: currentUser?.email || '',
        customerPhone: '' // No tenemos teléfono en los datos actuales
      };

      // Usar la función existente para descargar PDF
      await downloadInvoicePDF(invoiceData);

      // Cerrar loading
      window.Swal.close();

      // Mostrar éxito
      window.Swal.fire({
        title: '<i class="fas fa-check-circle mr-2"></i>¡PDF Generado!',
        html: `
          <div class="text-center py-4">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-file-pdf text-3xl text-green-600"></i>
            </div>
            <p class="text-gray-700 mb-3">Tu factura se ha descargado exitosamente.</p>
            <div class="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Factura:</strong> ${invoiceResponse.invoice.code}</p>
              <p><strong>Archivo:</strong> ${invoiceResponse.invoice.code}.pdf</p>
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#10B981',
        confirmButtonText: '<i class="fas fa-check mr-2"></i>Perfecto',
        width: '450px',
        customClass: {
          popup: 'rounded-2xl'
        },
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: true
      });

    } catch (error) {
      console.error('Error generating PDF:', error);

      // Cerrar loading si está abierto
      if (window.Swal) {
        window.Swal.close();
      }

      window.Swal.fire({
        title: '<i class="fas fa-times mr-2"></i>Error al Generar PDF',
        html: `
          <div class="text-center py-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-times text-3xl text-red-600"></i>
            </div>
            <p class="text-gray-700 mb-3">No se pudo generar el PDF de la factura.</p>
            <p class="text-sm text-gray-500">Por favor intenta nuevamente.</p>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#EF4444',
        confirmButtonText: '<i class="fas fa-redo mr-2"></i>Intentar de Nuevo',
        width: '450px',
        customClass: {
          popup: 'rounded-2xl'
        },
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: true
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  // Componente InvoicesSection
  const InvoicesSection = ({
    invoices,
    payments,
    loading,
    onMakePayment,
    onDownloadInvoice
  }: {
    invoices: InvoiceResponse[];
    payments: PaymentResponse[];
    loading: boolean;
    onMakePayment: (invoice: InvoiceResponse) => Promise<void>;
    onDownloadInvoice: (invoice: InvoiceResponse) => Promise<void>;
  }) => {
    if (loading) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </div>
      );
    }

    const pendingInvoices = invoices.filter(inv => {
      const outstandingBalance = inv.invoice.outstandingBalance;
      const total = inv.invoice.total ?? 0;
      const status = inv.invoice.status;

      // Lógica corregida para determinar si está pendiente:
      // 1. Si outstandingBalance es null/undefined, asumir pendiente
      // 2. Si outstandingBalance === 0 pero status no indica pagada, asumir error del backend y tratar como pendiente
      // 3. Si outstandingBalance > 0, definitivamente pendiente
      if (outstandingBalance === null || outstandingBalance === undefined) {
        return total > 0;
      }
      if (outstandingBalance === 0 && status !== 'PAID' && status !== 'CANCELLED') {
        return total > 0;
      }
      return outstandingBalance > 0;
    });

    const paidInvoices = invoices.filter(inv => {
      const outstandingBalance = inv.invoice.outstandingBalance;
      const status = inv.invoice.status;
      // Solo considerar pagada si outstandingBalance es 0 Y el status lo confirma
      return outstandingBalance === 0 && (status === 'PAID' || status === 'CANCELLED');
    });

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaFileInvoice className="text-[var(--color-primary)]" size={24} />
          <h2 className="text-xl font-semibold text-[var(--color-dark)]">
            Mis Facturas
          </h2>
        </div>

        {/* Facturas Pendientes */}
        {pendingInvoices.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <FaClock className="text-orange-500" />
              Facturas Pendientes
            </h3>
            <div className="space-y-4">
              {pendingInvoices.map((invoiceResponse) => {
                const invoice = invoiceResponse.invoice;
                // Calcular correctamente el saldo pendiente para mostrar
                let outstandingBalance = invoice.outstandingBalance;
                const status = invoice.status;

                // Aplicar la misma corrección que en handleMakePayment
                if (outstandingBalance === 0 && status !== 'PAID' && status !== 'CANCELLED') {
                  outstandingBalance = invoice.total ?? 0;
                } else if (outstandingBalance === null || outstandingBalance === undefined) {
                  outstandingBalance = invoice.total ?? 0;
                }

                const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();

                return (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-[var(--color-dark)]">
                          {invoice.code}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Fecha: {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
                        </p>
                        {invoice.dueDate && (
                          <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            Vence: {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                            {isOverdue && ' (Vencida)'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[var(--color-primary)]">
                          ${invoice.total.toFixed(2)} {invoice.currency}
                        </p>
                        <p className="text-sm text-gray-600">
                          Pendiente: ${outstandingBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onMakePayment(invoiceResponse)}
                        className="flex-1 bg-[var(--color-primary)] text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaDollarSign size={16} />
                        Pagar
                      </button>
                      <button
                        onClick={() => onDownloadInvoice(invoiceResponse)}
                        className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaDownload size={16} />
                        PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Facturas Pagadas */}
        {paidInvoices.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Facturas Pagadas
            </h3>
            <div className="space-y-4">
              {paidInvoices.map((invoiceResponse) => {
                const invoice = invoiceResponse.invoice;

                return (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-[var(--color-dark)]">
                          {invoice.code}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Fecha: {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-sm text-green-600 font-medium">
                          Estado: Pagada
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${invoice.total.toFixed(2)} {invoice.currency}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onDownloadInvoice(invoiceResponse)}
                        className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaDownload size={16} />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {invoices.length === 0 && (
          <div className="text-center py-8">
            <FaFileInvoice className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600">No tienes facturas registradas</p>
          </div>
        )}
      </div>
    );
  };

  // Componente PaymentsSection
  const PaymentsSection = ({
    payments,
    loading,
    onDownloadInvoice
  }: {
    payments: PaymentResponse[];
    loading: boolean;
    onDownloadInvoice: (invoice: InvoiceResponse) => Promise<void>;
  }) => {
    if (loading) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaHistory className="text-[var(--color-primary)]" size={24} />
          <h2 className="text-xl font-semibold text-[var(--color-dark)]">
            Historial de Pagos
          </h2>
        </div>

        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((paymentResponse) => {
              const payment = paymentResponse.paymentView;
              const invoice = paymentResponse.invoice.invoice;

              return (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg text-[var(--color-dark)]">
                        Pago #{payment.id}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Factura: {invoice.code}
                      </p>
                      <p className="text-sm text-gray-600">
                        Fecha: {new Date(payment.paid_at).toLocaleDateString('es-ES')}
                      </p>
                      <p className="text-sm text-gray-600">
                        Método: {payment.payment_method}
                      </p>
                      {payment.reference && (
                        <p className="text-sm text-gray-600">
                          Referencia: {payment.reference}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${payment.amount.toFixed(2)}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FaCheckCircle className="mr-1" size={12} />
                        Completado
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onDownloadInvoice(paymentResponse.invoice)}
                      className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaDownload size={16} />
                      Descargar Factura PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaHistory className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600">No tienes pagos registrados</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Mis Facturas
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus cotizaciones, facturas y pagos
          </p>
        </div>
      </div>

      {/* Customer Info */}
      {currentUser && (
        <div className="bg-[var(--color-light)] border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FaFileInvoiceDollar className="text-[var(--color-primary)]" size={20} />
            <div>
              <h3 className="font-semibold">{currentUser.name}</h3>
              <p className="text-sm text-gray-600">{currentUser.email}</p>
              <p className="text-xs text-gray-500">
                Cliente ID: {currentUser.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quotations Section */}
      <QuotationsSection
        quotations={quotations}
        loading={quotationsLoading}
        onApprove={handleApproveQuotation}
        onReject={handleRejectQuotation}
      />

      {/* Invoices Section */}
      <InvoicesSection
        invoices={invoices}
        payments={payments}
        loading={invoicesLoading}
        onMakePayment={handleMakePayment}
        onDownloadInvoice={handleDownloadInvoice}
      />

      {/* Payments History Section */}
      <PaymentsSection
        payments={payments}
        loading={paymentsLoading}
        onDownloadInvoice={handleDownloadInvoice}
      />
    </div>
  );
}
