"use client";

import React from 'react';
import { FaHistory, FaCalendarAlt, FaCreditCard, FaDollarSign } from 'react-icons/fa';
import type { Payment } from '../index';

interface PaymentHistoryProps {
  payments: Payment[];
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <FaHistory className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-500">No payment history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div
          key={payment.payment.id}
          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaCreditCard className="text-green-600" size={20} />
              <div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaCalendarAlt className="mr-1" size={12} />
                  {new Date(payment.payment.paymentDate).toLocaleDateString()}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Invoice #{payment.invoice.code}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-lg font-bold text-green-600">
                <FaDollarSign size={16} />
                {payment.payment.amount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {payment.payment.paymentMethod}
              </div>
              {payment.payment.notes && (
                <div className="text-xs text-gray-400 mt-1">
                  {payment.payment.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentHistory;