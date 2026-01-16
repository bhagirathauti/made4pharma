import React from 'react';

interface BillingSummaryProps {
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  shipping?: number;
  currency?: string;
  showBreakdown?: boolean;
  className?: string;
}

export const BillingSummary: React.FC<BillingSummaryProps> = ({
  subtotal,
  tax,
  taxRate = 0,
  discount = 0,
  shipping = 0,
  currency = '$',
  showBreakdown = true,
  className = '',
}) => {
  const calculatedTax = tax !== undefined ? tax : subtotal * (taxRate / 100);
  const total = subtotal + calculatedTax + shipping - discount;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Summary</h3>

      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">
            {currency}
            {subtotal.toFixed(2)}
          </span>
        </div>

        {/* Tax */}
        {showBreakdown && (calculatedTax > 0 || taxRate > 0) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Tax {taxRate > 0 && `(${taxRate}%)`}
            </span>
            <span className="font-medium text-gray-900">
              {currency}
              {calculatedTax.toFixed(2)}
            </span>
          </div>
        )}

        {/* Shipping */}
        {showBreakdown && shipping > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-gray-900">
              {currency}
              {shipping.toFixed(2)}
            </span>
          </div>
        )}

        {/* Discount */}
        {showBreakdown && discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Discount</span>
            <span className="font-medium text-green-600">
              -{currency}
              {discount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {currency}
              {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
