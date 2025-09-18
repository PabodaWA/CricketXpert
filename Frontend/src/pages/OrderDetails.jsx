import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUserId } from '../utils/getCurrentUser';

const OrderDetails = () => {
  const { orderId } = useParams(); // Extract orderId from URL (e.g., /orders/:orderId)
  const location = useLocation();
  const navigate = useNavigate();
  const { order: initialOrder, payment: initialPayment } = location.state || {};
  const [order, setOrder] = useState(initialOrder || {});
  const [payment, setPayment] = useState(initialPayment || {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current logged-in user ID
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId && !initialOrder) {
        setError('No order ID provided.');
        setLoading(false);
        return;
      }

      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        
        const response = await axios.get(`http://localhost:5000/api/orders/${orderId || initialOrder._id}`, config);
        setOrder(response.data || initialOrder);
        
        const paymentResponse = await axios.get(`http://localhost:5000/api/payment/order/${orderId || initialOrder._id}`, config);
        // Payment endpoint returns an array, get the first payment
        const payments = paymentResponse.data || [];
        setPayment(payments.length > 0 ? payments[0] : {});
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, initialOrder, initialPayment]);

  const handleBackToOrders = () => {
    navigate('/orders');
  };

  const handleDownloadOrder = async (orderId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        },
        responseType: 'blob' // Important for PDF download
      };
      
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}/download`, config);
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('Order PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading order PDF:', error);
      alert('Failed to download order PDF. Please try again.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action will notify the order manager for refund processing.')) {
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      const response = await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`, {}, config);
      
      if (response.data.success) {
        alert('Order cancelled successfully! The order manager has been notified for refund processing.');
        // Navigate back to orders list
        navigate('/orders');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  if (loading) return <div className="text-center p-8">Loading order details...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="bg-[#F1F2F7] min-h-screen text-[#36516C] p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Order Details</h2>

        {/* Order Information */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">Order Information</h3>
          <p><strong>Order ID:</strong> {order._id || 'N/A'}</p>
          <p><strong>Date:</strong> {new Date(order.date || order.createdAt || Date.now()).toLocaleDateString()}</p>
          <p><strong>Status:</strong> {order.status || 'N/A'}</p>
          <p><strong>Address:</strong> {order.address || 'N/A'}</p>
                          <p><strong>Total Amount:</strong> LKR {order.amount || 0}.00</p>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">Items</h3>
          {order.items && order.items.length > 0 ? (
            <ul className="space-y-2">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>
                    {item.productId?.name || item.productId || 'Unknown Product'} 
                    (Qty: {item.quantity})
                  </span>
                  <span>LKR {(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No items in this order.</p>
          )}
        </div>

        {/* Payment Information */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">Payment Information</h3>
          <p><strong>Payment ID:</strong> {payment._id || 'N/A'}</p>
                          <p><strong>Amount Paid:</strong> LKR {payment.amount || 0}.00</p>
          <p><strong>Payment Status:</strong> {payment.status || 'N/A'}</p>
          <p><strong>Payment Date:</strong> {new Date(payment.paymentDate || Date.now()).toLocaleDateString()}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleBackToOrders}
            className="bg-[#42ADF5] text-white py-2 px-4 rounded-lg hover:bg-[#2C8ED1] transition-colors"
          >
            Back to Orders
          </button>
          <button
            onClick={() => handleDownloadOrder(order._id)}
            className="bg-[#28a745] text-white py-2 px-4 rounded-lg hover:bg-[#218838] transition-colors"
          >
            Download PDF
          </button>
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <button
              onClick={() => handleCancelOrder(order._id)}
              className="bg-[#dc3545] text-white py-2 px-4 rounded-lg hover:bg-[#c82333] transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;