"use client";

import React from 'react';
import { FaFileInvoiceDollar, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import type { Invoice } from '../index';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onSelect }) => {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <FaFileInvoiceDollar className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-500">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div
          key={invoice.invoice.id}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onSelect(invoice)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaFileInvoiceDollar className="text-blue-600" size={24} />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Invoice #{invoice.invoice.code}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <FaCalendarAlt className="mr-1" size={12} />
                  {new Date(invoice.invoice.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-lg font-bold text-green-600">
                <FaDollarSign size={16} />
                {invoice.invoice.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                Pending: ${invoice.invoice.pendingAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvoiceList;