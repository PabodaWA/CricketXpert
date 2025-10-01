import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, AlertTriangle, CheckCircle, Plus, PlusCircle, Search, Filter, Mail } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStock, setUpdatingStock] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockLevel, setSelectedStockLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [manualStockInputs, setManualStockInputs] = useState({});
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    productId: '',
    quantity: '',
    email: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedStockLevel, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search by name or product code
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by stock level
    if (selectedStockLevel) {
      filtered = filtered.filter(product => {
        const stockStatus = getStockStatus(product.stock_quantity);
        return stockStatus === selectedStockLevel;
      });
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const updateStock = async (productId, stockChange) => {
    try {
      setUpdatingStock(prev => ({ ...prev, [productId]: true }));
      
      const response = await axios.put(`http://localhost:5000/api/products/${productId}/stock`, {
        stockChange: stockChange
      });

      // Update the product in the local state
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === productId 
            ? { ...product, stock_quantity: response.data.stock_quantity }
            : product
        )
      );
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Failed to update stock. Please try again.');
    } finally {
      setUpdatingStock(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleManualStockAdd = async (productId) => {
    const stockToAdd = manualStockInputs[productId];
    if (!stockToAdd || stockToAdd <= 0) {
      alert('Please enter a valid stock amount');
      return;
    }

    try {
      setUpdatingStock(prev => ({ ...prev, [productId]: true }));
      
      const response = await axios.put(`http://localhost:5000/api/products/${productId}/stock`, {
        stockChange: parseInt(stockToAdd)
      });

      // Update the product in the local state
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === productId 
            ? { ...product, stock_quantity: response.data.stock_quantity }
            : product
        )
      );

      // Clear the input
      setManualStockInputs(prev => ({ ...prev, [productId]: '' }));
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Failed to update stock. Please try again.');
    } finally {
      setUpdatingStock(prev => ({ ...prev, [productId]: false }));
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return 'out';
    if (stock < 10) return 'critical';
    if (stock < 50) return 'warning';
    return 'good';
  };

  const getStockColor = (status) => {
    switch (status) {
      case 'out': return 'bg-gray-50 border-gray-200';
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'good': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const handleSupplierEmail = async () => {
    if (!supplierForm.productId || !supplierForm.quantity || !supplierForm.email) {
      alert('Please fill in all fields');
      return;
    }

    if (supplierForm.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supplierForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setSendingEmail(true);
      const response = await axios.post('http://localhost:5000/api/supplier/contact-supplier', {
        productId: supplierForm.productId,
        quantity: parseInt(supplierForm.quantity),
        email: supplierForm.email
      });

      if (response.data.success) {
        alert('Email sent successfully to supplier!');
        setShowSupplierModal(false);
        setSupplierForm({ productId: '', quantity: '', email: '' });
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending supplier email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'out': return <Package className="w-5 h-5 text-gray-500" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStockTextColor = (status) => {
    switch (status) {
      case 'out': return 'text-gray-700';
      case 'critical': return 'text-red-700';
      case 'warning': return 'text-yellow-700';
      case 'good': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  // Sort filtered products by stock level (out first, then critical, then warning, then good)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const statusA = getStockStatus(a.stock_quantity);
    const statusB = getStockStatus(b.stock_quantity);
    
    const statusOrder = { out: 0, critical: 1, warning: 2, good: 3 };
    return statusOrder[statusA] - statusOrder[statusB];
  });

  // Count products by stock status (using filtered products for counts)
  const stockCounts = {
    out: filteredProducts.filter(p => getStockStatus(p.stock_quantity) === 'out').length,
    critical: filteredProducts.filter(p => getStockStatus(p.stock_quantity) === 'critical').length,
    warning: filteredProducts.filter(p => getStockStatus(p.stock_quantity) === 'warning').length,
    good: filteredProducts.filter(p => getStockStatus(p.stock_quantity) === 'good').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button 
            onClick={fetchProducts}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Monitor and manage product stock levels</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSupplierModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact Supplier
            </button>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                <span className="text-lg font-semibold text-gray-800">
                  Showing: {filteredProducts.length} of {products.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search by Name/Code */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Stock Level */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedStockLevel}
                onChange={(e) => setSelectedStockLevel(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Stock Levels</option>
                <option value="out">Out of Stock</option>
                <option value="critical">Restock Alert</option>
                <option value="warning">Low Stock</option>
                <option value="good">In Stock</option>
              </select>
            </div>

            {/* Filter by Category */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStockLevel('');
                setSelectedCategory('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>


        {/* Stock Status Legend */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Package className="w-4 h-4 text-gray-500" />
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium text-sm">Out of Stock</span>
              <span className="text-gray-600 text-xs">0 items</span>
            </div>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold ml-auto">
              {stockCounts.out}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <div className="flex flex-col">
              <span className="text-red-700 font-medium text-sm">Restock Alert</span>
              <span className="text-red-600 text-xs">1-9 items</span>
            </div>
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold ml-auto">
              {stockCounts.critical}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <div className="flex flex-col">
              <span className="text-yellow-700 font-medium text-sm">Low Stock</span>
              <span className="text-yellow-600 text-xs">10-49 items</span>
            </div>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold ml-auto">
              {stockCounts.warning}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div className="flex flex-col">
              <span className="text-green-700 font-medium text-sm">In Stock</span>
              <span className="text-green-600 text-xs">50+ items</span>
            </div>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold ml-auto">
              {stockCounts.good}
            </span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock_quantity);
            const isUpdating = updatingStock[product._id];
            
            return (
              <div
                key={product._id}
                className={`${getStockColor(stockStatus)} border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200`}
              >
                {/* Product Image */}
                <div className="mb-4">
                  <img
                    src={product.image_url || '/placeholder-image.jpg'}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">Code: {product.productId}</p>
                  <p className="text-sm text-gray-600 mb-1">Category: {product.category}</p>
                  
                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-lg font-bold text-gray-800">
                      Rs. {product.price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  {/* Stock Level */}
                  <div className="flex items-center gap-2 mb-3">
                    {getStockIcon(stockStatus)}
                    <span className={`font-semibold ${getStockTextColor(stockStatus)}`}>
                      Stock: {product.stock_quantity}
                    </span>
                  </div>
                </div>

                {/* Stock Update Buttons */}
                <div className="space-y-2">
                  {/* Quick Add Buttons */}
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => updateStock(product._id, 10)}
                      disabled={isUpdating}
                      className="px-1 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-colors text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      +10
                    </button>
                    
                    <button
                      onClick={() => updateStock(product._id, 20)}
                      disabled={isUpdating}
                      className="px-1 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-colors text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      +20
                    </button>
                    
                    <button
                      onClick={() => updateStock(product._id, 30)}
                      disabled={isUpdating}
                      className="px-1 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-colors text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      +30
                    </button>
                  </div>

                  {/* Manual Stock Input */}
                  <div className="flex gap-1 justify-center">
                    <input
                      type="number"
                      placeholder="Custom"
                      value={manualStockInputs[product._id] || ''}
                      onChange={(e) => setManualStockInputs(prev => ({ 
                        ...prev, 
                        [product._id]: e.target.value 
                      }))}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      min="1"
                      disabled={isUpdating}
                    />
                    <button
                      onClick={() => handleManualStockAdd(product._id)}
                      disabled={isUpdating || !manualStockInputs[product._id]}
                      className="px-2 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Match Your Filters</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria or clearing the filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStockLevel('');
                setSelectedCategory('');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Found</h3>
            <p className="text-gray-500">Add some products to start managing your inventory.</p>
          </div>
        )}

        {/* Supplier Contact Modal */}
        {showSupplierModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Contact Supplier</h2>
                <button
                  onClick={() => setShowSupplierModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Product (Restock Alert Items)
                  </label>
                  <select
                    value={supplierForm.productId}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a product...</option>
                    {products
                      .filter(product => product.stock_quantity > 0 && product.stock_quantity < 10)
                      .map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} - Stock: {product.stock_quantity} (Code: {product.productId})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity to Order
                  </label>
                  <input
                    type="number"
                    value={supplierForm.quantity}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="Enter quantity..."
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Email
                  </label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="supplier@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSupplierEmail}
                  disabled={sendingEmail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
