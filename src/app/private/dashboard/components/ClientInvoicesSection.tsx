"use client";

import React, { useEffect, useState } from 'react';
import {
  getInvoicesByUser,
  getPaymentsByUser,
  getPaymentMethods,
  createPayment,
  Invoice,
  Payment,
  PaymentMethod,
  PaymentRequest,
} from '@/features/invoices';
import InvoiceList from '@/features/invoices/components/InvoiceList';
import InvoiceDetailsModal from '@/features/invoices/components/InvoiceDetailsModal';
import PaymentModal from '@/features/invoices/components/PaymentModal';
import PaymentHistory from '@/features/invoices/components/PaymentHistory';

interface ClientInvoicesSectionProps {
  userId: number;
}

const ClientInvoicesSection: React.FC<ClientInvoicesSectionProps> = ({ userId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    const [inv, pay, methods] = await Promise.all([
      getInvoicesByUser(userId),
      getPaymentsByUser(userId),
      getPaymentMethods(),
    ]);
    setInvoices(inv);
    setPayments(pay);
    setPaymentMethods(methods);
    setLoading(false);
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetails(true);
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPayment(true);
  };

  const handleSubmitPayment = async (amount: number, methodId: number, reference?: string) => {
    if (!selectedInvoice) return;
    setLoading(true);
    const paymentReq: PaymentRequest = {
      invoice: selectedInvoice.id,
      methodId,
      amount,
      reference,
    };
    await createPayment(paymentReq);
    setShowPayment(false);
    setSelectedInvoice(null);
    await fetchData();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Invoices</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <InvoiceList
            invoices={invoices}
            onSelect={handleSelectInvoice}
          />
          {selectedInvoice && showDetails && (
            <InvoiceDetailsModal
              invoice={selectedInvoice}
              onClose={() => { setShowDetails(false); setSelectedInvoice(null); }}
            />
          )}
          {selectedInvoice && showPayment && (
            <PaymentModal
              invoice={selectedInvoice}
              paymentMethods={paymentMethods}
              onSubmit={handleSubmitPayment}
              onClose={() => { setShowPayment(false); setSelectedInvoice(null); }}
            />
          )}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2">Payment History</h3>
            <PaymentHistory payments={payments} />
          </div>
        </>
      )}
    </div>
  );
};

export default ClientInvoicesSection;