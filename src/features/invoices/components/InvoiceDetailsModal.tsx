"use client";

import React, { useState } from 'react';
import { FaTimes, FaFileInvoiceDollar, FaCalendarAlt, FaDollarSign, FaDownload, FaSpinner } from 'react-icons/fa';
import type { Invoice } from '../index';
import { downloadInvoicePDF } from '@/utils/invoicePDF';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoice, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Preparar los datos de la factura para el PDF
      const invoiceData = {
        id: invoice.invoice.id,
        code: invoice.invoice.code,
        createdAt: invoice.invoice.issueDate,
        status: invoice.invoice.status,
        totalAmount: invoice.invoice.total,
        pendingAmount: invoice.invoice.outstandingBalance || 0,
        items: invoice.item.map(item => ({
          id: item.id.quotationId || 0,
          description: `${item.name} - ${item.brand} (${item.categoria})`,
          quantity: item.quantity,
          price: item.price,
          total: item.subtotal
        })),
        customerName: 'Cliente', // Puedes obtener esto del contexto de usuario si está disponible
        customerEmail: '', // Puedes obtener esto del contexto de usuario si está disponible
        customerPhone: '' // Puedes obtener esto del contexto de usuario si está disponible
      };

      await downloadInvoicePDF(invoiceData);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar la factura. Por favor, inténtalo de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <FaFileInvoiceDollar className="mr-2 text-blue-600" />
            Detalles de la Factura
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Información de la Factura</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Factura N°:</span> {invoice.invoice.code}</p>
                <p><span className="font-medium">Fecha:</span> {new Date(invoice.invoice.issueDate).toLocaleDateString('es-ES')}</p>
                <p><span className="font-medium">Estado:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    invoice.invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    invoice.invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.invoice.status === 'PAID' ? 'PAGADA' :
                     invoice.invoice.status === 'PENDING' ? 'PENDIENTE' : 'CANCELADA'}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Resumen de Pago</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Total:</span> ${invoice.invoice.total.toFixed(2)}</p>
                <p><span className="font-medium">Pagado:</span> ${(invoice.invoice.total - (invoice.invoice.outstandingBalance || 0)).toFixed(2)}</p>
                <p><span className="font-medium">Pendiente:</span> ${(invoice.invoice.outstandingBalance || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Productos</h3>
            <div className="space-y-3">
              {invoice.item.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.brand} - {item.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Cant: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Generando PDF...
              </>
            ) : (
              <>
                <FaDownload className="mr-2" />
                Descargar PDF
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;