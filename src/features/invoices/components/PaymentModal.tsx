"use client";

import React, { useState } from 'react';
import { FaTimes, FaCreditCard, FaMoneyBillWave, FaDownload, FaCheck } from 'react-icons/fa';
import type { Invoice, PaymentMethod } from '../index';
import { downloadInvoicePDF } from '@/utils/invoicePDF';

interface PaymentModalProps {
  invoice: Invoice;
  paymentMethods: PaymentMethod[];
  onSubmit: (amount: number, methodId: number, reference?: string) => void;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  paymentMethods,
  onSubmit,
  onClose,
  onPaymentSuccess
}) => {
  const [amount, setAmount] = useState((invoice.invoice.outstandingBalance || 0).toString());
  const [selectedMethod, setSelectedMethod] = useState<number>(paymentMethods[0]?.id || 0);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(parseFloat(amount), selectedMethod, reference);
      setPaymentCompleted(true);

      // Llamar al callback de éxito si existe
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Preparar los datos de la factura para el PDF
      const invoiceData = {
        id: invoice.invoice.id,
        code: invoice.invoice.code,
        createdAt: invoice.invoice.issueDate,
        status: 'PAID', // Después del pago, marcar como pagada
        totalAmount: invoice.invoice.total,
        pendingAmount: 0, // Después del pago, no hay pendiente
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
      console.error('Error downloading PDF:', error);
      alert('Error al descargar la factura. Por favor, inténtalo de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  if (paymentCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center text-green-600">
              <FaCheck className="mr-2" />
              ¡Pago Exitoso!
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="p-6 text-center">
            <div className="mb-4">
              <FaCheck className="mx-auto text-green-500 text-4xl mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pago procesado correctamente
              </h3>
              <p className="text-gray-600 mb-4">
                Tu pago de ${parseFloat(amount).toFixed(2)} ha sido registrado exitosamente.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>¿Quieres descargar tu factura?</strong><br />
                Puedes descargar un PDF con todos los detalles de tu compra.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <FaDownload className="mr-2" />
                    Descargar Factura PDF
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <FaMoneyBillWave className="mr-2 text-green-600" />
            Realizar Pago
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Factura #{invoice.invoice.code}
            </label>
            <div className="text-sm text-gray-500">
              Monto pendiente: ${(invoice.invoice.outstandingBalance || 0).toFixed(2)}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Pago
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={invoice.invoice.outstandingBalance || 0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia (Opcional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Referencia de transacción o notas"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Pagar Ahora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;