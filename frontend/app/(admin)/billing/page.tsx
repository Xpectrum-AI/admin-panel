'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  balance: number;
  currency: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

interface Price {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: string;
    interval_count: number;
  };
}

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface CheckoutSession {
  id: string;
  amount_total: number;
  currency: string;
  status: string;
  created: number;
  payment_status: string;
}

const BillingPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [checkoutSessions, setCheckoutSessions] = useState<CheckoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  
  const [customerForm, setCustomerForm] = useState({
    email: '',
    name: '',
    phone: ''
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: ''
  });

  const [checkoutForm, setCheckoutForm] = useState({
    customer: '',
    price_id: '',
    success_url: 'https://admin-test.xpectrum-ai.com/billing/success',
    cancel_url: 'https://admin-test.xpectrum-ai.com/billing/cancel'
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin-test.xpectrum-ai.com';
  const API_KEY = 'xpectrum-ai@123';

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  };

  // Fetch data functions
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stripe/v1/customers`, { headers });
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers.data || []);
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stripe/v1/products`, { headers });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products.data || []);
      }
    } catch {
      console.error('Failed to fetch products');
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stripe/v1/prices`, { headers });
      const data = await response.json();
      if (data.success) {
        setPrices(data.prices.data || []);
      }
    } catch {
      console.error('Failed to fetch prices');
    }
  }, []);

  const fetchPaymentMethods = useCallback(async (customerId: string) => {
    try {
      const response = await fetch(`${API_BASE}/stripe/v1/payment_methods?customer=${customerId}`, { headers });
      const data = await response.json();
      if (data.success) {
        setPaymentMethods(data.paymentMethods.data || []);
      } else {
        // If customer doesn't exist, set empty array
        setPaymentMethods([]);
      }
    } catch {
      console.error('Failed to fetch payment methods');
      setPaymentMethods([]);
    }
  }, []);

  const fetchCheckoutSessions = useCallback(async (customerId: string) => {
    try {
      const response = await fetch(`${API_BASE}/stripe/v1/checkout/sessions?customer=${customerId}`, { headers });
      const data = await response.json();
      if (data.success) {
        setCheckoutSessions(data.sessions.data || []);
      } else {
        // If customer doesn't exist, set empty array
        setCheckoutSessions([]);
      }
    } catch {
      console.error('Failed to fetch checkout sessions');
      setCheckoutSessions([]);
    }
  }, []);

  // Action functions
  const handleCreateCustomer = async () => {
    try {
      const response = await fetch(`${API_BASE}/stripe/v1/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(customerForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowCustomerModal(false);
        setCustomerForm({ email: '', name: '', phone: '' });
        fetchCustomers();
        alert('Customer created successfully!');
      } else {
        alert(data.error || 'Failed to create customer');
      }
    } catch {
      alert('Failed to create customer');
    }
  };

  const handleCreateProduct = async () => {
    try {
      const response = await fetch(`${API_BASE}/stripe/v1/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(productForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowProductModal(false);
        setProductForm({ name: '', description: '' });
        fetchProducts();
        alert('Product created successfully!');
      } else {
        alert(data.error || 'Failed to create product');
      }
    } catch {
      alert('Failed to create product');
    }
  };

  const handleCreateCheckoutSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/stripe/v1/checkout/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(checkoutForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowCheckoutModal(false);
        setCheckoutForm({
          customer: '',
          price_id: '',
          success_url: 'https://admin-test.xpectrum-ai.com/billing/success',
          cancel_url: 'https://admin-test.xpectrum-ai.com/billing/cancel'
        });
        // Redirect to Stripe Checkout
        window.location.href = data.session.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch {
      alert('Failed to create checkout session');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/stripe/v1/customers/${customerId}`, {
        method: 'DELETE',
        headers
      });
      const data = await response.json();
      if (data.success) {
        fetchCustomers();
        if (selectedCustomer === customerId) {
          setSelectedCustomer('');
        }
        alert('Customer deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete customer');
      }
    } catch {
      alert('Failed to delete customer');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCustomers(),
        fetchProducts(),
        fetchPrices()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchCustomers, fetchPrices, fetchProducts]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchPaymentMethods(selectedCustomer);
      fetchCheckoutSessions(selectedCustomer);
    }
  }, [selectedCustomer, fetchPaymentMethods, fetchCheckoutSessions]);

  if (loading) {
    return (
      <div className="container mx-auto mt-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Billing & Payments Dashboard</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            {error}
          </div>
        )}

        {/* Customer Management */}
        <div className="bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customer Management</h2>
            <button 
              onClick={() => setShowCustomerModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Customer
            </button>
          </div>
          <div className="p-6">
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300 mb-4">No customers found. Create your first customer to get started!</p>
                <button 
                  onClick={() => setShowCustomerModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create First Customer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">{customer.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{customer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{customer.phone || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          ₹{(customer.balance / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedCustomer(customer.id)}
                            className="text-blue-600 hover:text-blue-300 border border-blue-600 hover:border-blue-300 px-3 py-1 rounded text-xs"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-300 border border-red-600 hover:border-red-300 px-3 py-1 rounded text-xs ml-2"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Products & Prices */}
        <div className="bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Products & Prices</h2>
            <button 
              onClick={() => setShowProductModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Create Product
            </button>
          </div>
          <div className="p-6">
            {products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300 mb-4">No products found. Create your first product to start selling!</p>
                <button 
                  onClick={() => setShowProductModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Create First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const productPrices = prices.filter(price => price.product === product.id);
                  return (
                    <div key={product.id} className="border border-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-2 text-gray-300">{product.name}</h3>
                      <p className="text-gray-300 text-sm mb-4">{product.description}</p>
                      <div className="space-y-2">
                        {productPrices.map((price) => (
                          <div key={price.id} className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">
                              ₹{(price.unit_amount / 100).toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                setCheckoutForm({
                                  ...checkoutForm,
                                  price_id: price.id
                                });
                                setShowCheckoutModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-300 text-xs"
                            >
                              Buy Now
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Customer Details */}
        {selectedCustomer && (
          <div className="bg-gray-800 rounded-lg shadow-md mb-8">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Customer Details</h2>
              <button
                onClick={() => setSelectedCustomer('')}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-300">Payment Methods</h3>
                  <div className="space-y-2">
                    {paymentMethods.length === 0 ? (
                      <p className="text-gray-300">No payment methods found for this customer.</p>
                    ) : (
                      paymentMethods.map((method) => (
                        <div key={method.id} className="border border-gray-700 rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium capitalize text-gray-300">{method.card?.brand}</span>
                              <span className="text-gray-300 ml-2">•••• {method.card?.last4}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {method.card?.exp_month}/{method.card?.exp_year}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-300">Payment History</h3>
                  <div className="space-y-2">
                    {checkoutSessions.length === 0 ? (
                      <p className="text-gray-300">No payment history found for this customer.</p>
                    ) : (
                      checkoutSessions.map((session) => (
                        <div key={session.id} className="border border-gray-700 rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-300">₹{(session.amount_total / 100).toFixed(2)}</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                session.payment_status === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {session.payment_status}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(session.created * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Customer Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Create Customer</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Customer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Create Product</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      placeholder="1000 AI Credits"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      placeholder="1000 AI processing credits"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProduct}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Create Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Checkout Session Modal */}
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Create Checkout Session</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Customer</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={checkoutForm.customer}
                      onChange={(e) => setCheckoutForm({...checkoutForm, customer: e.target.value})}
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={checkoutForm.price_id}
                      onChange={(e) => setCheckoutForm({...checkoutForm, price_id: e.target.value})}
                      placeholder="price_xxx"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCheckoutSession}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage; 