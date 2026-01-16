import React, { useState } from 'react';
import {
  StatusBadge,
  StatCard,
  StockIndicator,
  ExpiryBadge,
  CartItem,
  BillingSummary,
  InvoicePreview,
  EmptyState,
  Heading,
} from './components/ui';
import type { CartItemData, InvoiceData } from './components/ui';

export const BusinessComponentsDemo: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItemData[]>([
    {
      id: '1',
      name: 'Paracetamol 500mg',
      price: 5.99,
      quantity: 2,
      maxQuantity: 10,
    },
    {
      id: '2',
      name: 'Ibuprofen 400mg',
      price: 8.50,
      quantity: 1,
      maxQuantity: 5,
    },
    {
      id: '3',
      name: 'Amoxicillin 250mg',
      price: 12.99,
      quantity: 3,
      maxQuantity: 8,
    },
  ]);

  const handleQuantityChange = (id: string, quantity: number) => {
    setCartItems((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 8.5;
  const discount = 5.0;

  const invoiceData: InvoiceData = {
    invoiceNumber: 'INV-2026-001',
    date: '2026-01-02',
    dueDate: '2026-01-16',
    customerName: 'John Doe',
    customerAddress: '123 Main St, City, State 12345',
    customerEmail: 'john.doe@example.com',
    customerPhone: '+1 (555) 123-4567',
    companyName: 'MediCare Pharmacy',
    companyAddress: '456 Healthcare Ave, Medical City, MC 67890',
    companyPhone: '+1 (555) 987-6543',
    companyEmail: 'info@medicare.com',
    items: cartItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
    subtotal,
    tax: subtotal * (taxRate / 100),
    discount,
    total: subtotal + subtotal * (taxRate / 100) - discount,
    notes: 'Thank you for your business. Payment is due within 14 days.',
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <Heading level={1}>Business Components Demo</Heading>

        {/* Status Badges */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <Heading level={2} className="mb-4">Status Badges</Heading>
          <div className="flex flex-wrap gap-3">
            <StatusBadge variant="active" />
            <StatusBadge variant="inactive" />
            <StatusBadge variant="paid" />
            <StatusBadge variant="unpaid" />
            <StatusBadge variant="expired" />
            <StatusBadge variant="expiring" />
            <StatusBadge variant="low-stock" />
            <StatusBadge variant="out-of-stock" />
            <StatusBadge variant="pending" />
            <StatusBadge variant="completed" />
            <StatusBadge variant="cancelled" />
          </div>
        </section>

        {/* Stat Cards */}
        <section>
          <Heading level={2} className="mb-4">Statistics Cards</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value="$24,567"
              trend="up"
              percentage={12.5}
              description="vs last month"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <StatCard
              title="Total Orders"
              value="1,284"
              trend="up"
              percentage={8.3}
              description="vs last month"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              }
            />
            <StatCard
              title="Low Stock Items"
              value="23"
              trend="down"
              percentage={5.2}
              description="vs last week"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              }
            />
            <StatCard
              title="Expiring Soon"
              value="12"
              trend="up"
              percentage={3.1}
              description="next 30 days"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </div>
        </section>

        {/* Stock Indicators */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <Heading level={2} className="mb-4">Stock Indicators</Heading>
          <div className="space-y-4">
            <StockIndicator current={450} max={500} />
            <StockIndicator current={120} max={500} />
            <StockIndicator current={45} max={500} />
            <StockIndicator current={5} max={500} />
          </div>
        </section>

        {/* Expiry Badges */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <Heading level={2} className="mb-4">Expiry Badges</Heading>
          <div className="flex flex-wrap gap-3">
            <ExpiryBadge expiryDate={new Date(Date.now() - 86400000)} />
            <ExpiryBadge expiryDate={new Date()} />
            <ExpiryBadge expiryDate={new Date(Date.now() + 3 * 86400000)} />
            <ExpiryBadge expiryDate={new Date(Date.now() + 15 * 86400000)} />
            <ExpiryBadge expiryDate={new Date(Date.now() + 60 * 86400000)} />
            <ExpiryBadge expiryDate={new Date(Date.now() + 180 * 86400000)} />
          </div>
        </section>

        {/* Cart & Billing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Heading level={2}>Shopping Cart</Heading>
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))
            ) : (
              <EmptyState
                title="Your cart is empty"
                description="Add items to your cart to continue shopping"
                action={{
                  label: 'Browse Products',
                  onClick: () => alert('Navigate to products'),
                }}
                icon={
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                }
              />
            )}
          </div>
          <div>
            <Heading level={2} className="mb-4">Billing</Heading>
            {cartItems.length > 0 ? (
              <BillingSummary
                subtotal={subtotal}
                taxRate={taxRate}
                discount={discount}
                showBreakdown
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
                No items in cart
              </div>
            )}
          </div>
        </div>

        {/* Invoice Preview */}
        {cartItems.length > 0 && (
          <section>
            <Heading level={2} className="mb-4">Invoice Preview</Heading>
            <InvoicePreview data={invoiceData} />
          </section>
        )}

        {/* Empty State Examples */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <Heading level={2} className="mb-4">Empty States</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg">
              <EmptyState
                title="No orders found"
                description="You haven't placed any orders yet. Start shopping to see your orders here."
                action={{
                  label: 'Start Shopping',
                  onClick: () => alert('Navigate to shop'),
                }}
              />
            </div>
            <div className="border border-gray-200 rounded-lg">
              <EmptyState
                title="No products available"
                description="There are no products in this category at the moment."
                icon={
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
