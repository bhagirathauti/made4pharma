import React, { useRef } from 'react';

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  notes?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

interface InvoicePreviewProps {
  data: InvoiceData;
  currency?: string;
  onDownload?: () => void;
  className?: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  data,
  currency = '$',
  onDownload,
  className = '',
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      handlePrint();
    }
  };

  return (
    <div className={className}>
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download
        </button>
      </div>

      {/* Invoice Content */}
      <div ref={printRef} className="bg-white border border-gray-200 rounded-lg p-8 print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="mt-2 text-sm text-gray-600">#{data.invoiceNumber}</p>
          </div>
          {data.companyName && (
            <div className="text-right">
              <h2 className="text-xl font-semibold text-gray-900">{data.companyName}</h2>
              {data.companyAddress && <p className="mt-1 text-sm text-gray-600">{data.companyAddress}</p>}
              {data.companyPhone && <p className="text-sm text-gray-600">{data.companyPhone}</p>}
              {data.companyEmail && <p className="text-sm text-gray-600">{data.companyEmail}</p>}
            </div>
          )}
        </div>

        {/* Invoice Details & Customer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase mb-2">Bill To</h3>
            <p className="text-sm font-medium text-gray-900">{data.customerName}</p>
            {data.customerAddress && <p className="text-sm text-gray-600">{data.customerAddress}</p>}
            {data.customerEmail && <p className="text-sm text-gray-600">{data.customerEmail}</p>}
            {data.customerPhone && <p className="text-sm text-gray-600">{data.customerPhone}</p>}
          </div>
          <div className="text-right">
            <div className="mb-2">
              <span className="text-sm text-gray-600">Invoice Date: </span>
              <span className="text-sm font-medium text-gray-900">{data.date}</span>
            </div>
            {data.dueDate && (
              <div>
                <span className="text-sm text-gray-600">Due Date: </span>
                <span className="text-sm font-medium text-gray-900">{data.dueDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-3 text-left text-sm font-semibold text-gray-900">Item</th>
                <th className="py-3 text-right text-sm font-semibold text-gray-900">Quantity</th>
                <th className="py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                <th className="py-3 text-right text-sm font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 text-sm text-gray-900">{item.name}</td>
                  <td className="py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-gray-900 text-right">
                    {currency}
                    {item.price.toFixed(2)}
                  </td>
                  <td className="py-3 text-sm text-gray-900 text-right">
                    {currency}
                    {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">
                {currency}
                {data.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium text-gray-900">
                {currency}
                {data.tax.toFixed(2)}
              </span>
            </div>
            {data.discount && data.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discount:</span>
                <span className="font-medium text-green-600">
                  -{currency}
                  {data.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-base font-semibold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                {currency}
                {data.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
