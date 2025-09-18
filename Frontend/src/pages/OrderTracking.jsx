import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search, Package, Clock, CheckCircle, XCircle, Truck, MapPin } from 'lucide-react';

const OrderTracking = () => {
  const location = useLocation();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if orderId was passed from MyOrders page
  useEffect(() => {
    console.log('OrderTracking useEffect - location.state:', location.state);
    if (location.state?.orderId) {
      console.log('Order ID received from MyOrders:', location.state.orderId);
      setOrderId(location.state.orderId);
      trackOrder(location.state.orderId);
    } else {
      console.log('No order ID in location.state');
    }
  }, [location.state]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'created':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'cart_pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'created':
        return <Package className="w-5 h-5" />;
      case 'processing':
        return <Clock className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      case 'cart_pending':
        return <Clock className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'cart_pending':
        return 'Your order is in the cart and pending payment.';
      case 'created':
        return 'Your order has been created and is being prepared.';
      case 'processing':
        return 'Your order is being processed and will be shipped soon.';
      case 'completed':
        return 'Your order has been delivered successfully!';
      case 'cancelled':
        return 'Your order has been cancelled.';
      default:
        return 'Order status unknown.';
    }
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { status: 'cart_pending', label: 'Cart Pending', completed: false },
      { status: 'created', label: 'Order Created', completed: false },
      { status: 'processing', label: 'Processing', completed: false },
      { status: 'completed', label: 'Delivered', completed: false }
    ];

    const statusOrder = ['cart_pending', 'created', 'processing', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  const trackOrder = async (id = null) => {
    const orderIdToTrack = id || orderId;
    
    if (!orderIdToTrack.trim()) {
      setError('Please enter an order ID');
      return;
    }

    console.log('Tracking order with ID:', orderIdToTrack);
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      console.log('User info:', userInfo);
      
      if (!userInfo || !userInfo.token) {
        setError('Please login to track your orders.');
        return;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      console.log('Making API call to:', `http://localhost:5000/api/orders/${orderIdToTrack}`);
      const response = await axios.get(`http://localhost:5000/api/orders/${orderIdToTrack}`, config);
      console.log('API response:', response.data);
      
      if (response.data) {
        console.log('Order data received:', response.data);
        
        // Validate order data
        if (!response.data._id || !response.data.status) {
          setError('Invalid order data received from server.');
          return;
        }
        
        setOrder(response.data);
      } else {
        setError('No order data received from server.');
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      console.error('Error response:', err.response);
      
      if (err.response?.status === 401) {
        setError('Please login to track your orders.');
      } else if (err.response?.status === 404) {
        setError('Order not found. Please check your order ID and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Error loading order details: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      trackOrder();
    }
  };

  return (
    <div className="bg-[#F1F2F7] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
          <h1 className="text-3xl font-bold text-[#072679] mb-4">Track Your Order</h1>
          <p className="text-[#36516C] mb-6">Enter your order ID to track the current status of your order</p>
          
          {/* Search Input */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter Order ID..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42ADF5] focus:border-transparent"
              />
            </div>
            <button
              onClick={() => trackOrder()}
              disabled={loading}
              className="mt-4 w-full bg-[#42ADF5] text-white py-3 rounded-lg hover:bg-[#2C8ED1] transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#42ADF5] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && !order && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-500 text-lg mb-4">❌ Unable to load order details</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError('');
                setOrder(null);
              }}
              className="bg-[#42ADF5] text-white px-6 py-2 rounded-lg hover:bg-[#2C8ED1] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Order Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#072679]">Order #{order._id}</h2>
                <p className="text-[#36516C]">Placed on {new Date(order.date || order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-2">{order.status}</span>
                </span>
                <p className="text-sm text-[#36516C] mt-1">{getStatusDescription(order.status)}</p>
              </div>
            </div>

            {/* Order Progress */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#072679] mb-4">Order Progress</h3>
              <div className="flex items-center justify-between">
                {getStatusSteps(order.status).map((step, index) => (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      step.completed 
                        ? 'bg-[#42ADF5] text-white' 
                        : step.current 
                        ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-300'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : step.current ? (
                        <Clock className="w-6 h-6" />
                      ) : (
                        <Package className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${
                        step.completed || step.current ? 'text-[#072679]' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                    {index < getStatusSteps(order.status).length - 1 && (
                      <div className={`w-full h-1 mt-4 ${
                        step.completed ? 'bg-[#42ADF5]' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-[#072679] mb-3">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Order ID:</strong> {order._id}</p>
                  <p><strong>Total Amount:</strong> LKR {order.amount?.toFixed(2) || '0.00'}</p>
                  <p><strong>Items:</strong> {order.items?.length || 0} items</p>
                  <p><strong>Order Date:</strong> {new Date(order.date || order.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#072679] mb-3">Delivery Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-2" />
                    <span>{order.address || 'No address provided'}</span>
                  </div>
                  <p><strong>Status:</strong> {order.status}</p>
                  {order.status === 'completed' && (
                    <p className="text-green-600 font-medium">✅ Order delivered successfully!</p>
                  )}
                  {order.status === 'cancelled' && (
                    <p className="text-red-600 font-medium">❌ Order has been cancelled</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-[#072679] mb-3">Order Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {item.productId?.name || `Product ID: ${item.productId}` || 'Unknown Product'}
                        </p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">LKR {(item.priceAtOrder * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">LKR {item.priceAtOrder} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-[#072679] mb-3">Need Help?</h3>
          <p className="text-[#36516C] mb-3">
            If you're having trouble tracking your order or have any questions, please contact our customer support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-[#42ADF5] text-white px-6 py-2 rounded-lg hover:bg-[#2C8ED1] transition-colors">
              Contact Support
            </button>
            <button className="border border-[#42ADF5] text-[#42ADF5] px-6 py-2 rounded-lg hover:bg-[#42ADF5] hover:text-white transition-colors">
              View All Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
