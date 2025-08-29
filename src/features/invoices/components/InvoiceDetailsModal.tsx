"use client";

import React from 'react';
import { FaTimes, FaFileInvoiceDollar, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import type { Invoice } from '../index';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoice, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <FaFileInvoiceDollar className="mr-2 text-blue-600" />
            Invoice Details
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
              <h3 className="font-semibold text-gray-900 mb-2">Invoice Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Invoice #:</span> {invoice.invoice.code}</p>
                <p><span className="font-medium">Date:</span> {new Date(invoice.invoice.createdAt).toLocaleDateString()}</p>
                <p><span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    invoice.invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    invoice.invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.invoice.status}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Total:</span> ${invoice.invoice.total.toFixed(2)}</p>
                <p><span className="font-medium">Paid:</span> ${invoice.invoice.paidAmount.toFixed(2)}</p>
                <p><span className="font-medium">Pending:</span> ${invoice.invoice.pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
            <div className="space-y-3">
              {invoice.itemResponse.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.brand} - {item.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;