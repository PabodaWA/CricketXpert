import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUserId, isLoggedIn } from '../utils/getCurrentUser';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, totalData, address } = location.state || { cart: [], totalData: { subtotal: 0, deliveryFee: 450, total: 0 }, address: '' };
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
    country: 'India',
    email: ''
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartOrder, setCartOrder] = useState(null);
  const [products, setProducts] = useState([]);

  // Get current logged-in user ID
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchUserDetails = async () => {
      // Check if user is logged in
      if (!isLoggedIn() || !userId) {
        console.log('User not logged in or no user ID:', { isLoggedIn: isLoggedIn(), userId });
        setError('Please log in to continue with payment.');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching user details for userId:', userId);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        const response = await axios.get(`http://localhost:5000/api/users/profile`, config);
        setUser(response.data);
        setPaymentInfo(prev => ({ ...prev, email: response.data.email || '' }));
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details.');
      } finally {
        setLoading(false);
      }
    };

    const fetchCartOrder = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        const response = await axios.get(`http://localhost:5000/api/orders/cart/${userId}`, config);
        setCartOrder(response.data);
      } catch (err) {
        console.error('Error fetching cart order:', err);
        // If no cart order exists, we'll create one during payment
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products/');
        setProducts(res.data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };

    fetchUserDetails();
    fetchCartOrder();
    fetchProducts();
    console.log('Received state in Payment:', location.state);
    if (!location.state) {
      console.warn('No state passed to Payment page.');
    }
  }, [location.state, userId]);

  const getProductDetails = (productId) => {
    return products.find(product => product._id === productId) || {};
  };

  const handleChange = (field, value) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }));
  };

  const validatePaymentInfo = () => {
    const cardNumber = paymentInfo.cardNumber.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length !== 16 || isNaN(cardNumber)) {
      setError('Please enter a valid 16-digit card number.');
      return false;
    }
    if (!paymentInfo.expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      setError('Please enter a valid expiry date (MM/YY).');
      return false;
    }
    if (!paymentInfo.cvc || paymentInfo.cvc.length !== 3 || isNaN(paymentInfo.cvc)) {
      setError('Please enter a valid 3-digit CVC.');
      return false;
    }
    if (!paymentInfo.cardholderName.trim()) {
      setError('Please enter the cardholder name.');
      return false;
    }
    setError(null);
    return true;
  };

  const handlePay = async () => {
    if (!validatePaymentInfo()) return;

    setLoading(true);
    try {
      let orderToComplete = cartOrder;

      // If no cart order exists, create one first
      if (!cartOrder) {
        console.log('No cart order found, creating one...');
        const orderItems = cart.map(item => {
          const product = getProductDetails(item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            priceAtOrder: product.price || 0
          };
        });
        
        // Use the address from state, user data, or fallback
        const deliveryAddress = address || user?.address || 'No address provided';
        
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const orderConfig = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        
        const newCartOrder = await axios.post('http://localhost:5000/api/orders/cart', {
          customerId: userId,
          items: orderItems,
          amount: totalData.total,
          address: deliveryAddress
        }, orderConfig);
        orderToComplete = newCartOrder.data;
        setCartOrder(orderToComplete);
      }

      console.log('Creating payment with:', { 
        userId, 
        orderId: orderToComplete._id, 
        paymentType: 'order_payment', 
        amount: totalData.total, 
        status: 'success', 
        paymentDate: new Date() 
      });
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      const paymentRes = await axios.post('http://localhost:5000/api/payment/', {
        userId,
        orderId: orderToComplete._id,
        paymentType: 'order_payment',
        amount: totalData.total,
        status: 'success',
        paymentDate: new Date()
      }, config);
      console.log('Payment created:', paymentRes.data);

      // Complete the cart order (change status from 'cart_pending' to 'created')
      console.log('Completing cart order:', orderToComplete._id);
      const completedOrder = await axios.put('http://localhost:5000/api/orders/cart/complete', {
        orderId: orderToComplete._id,
        paymentId: paymentRes.data._id
      }, config);
      console.log('Order completed:', completedOrder.data);

      localStorage.removeItem('cricketCart');
      navigate('/orders', { state: { order: completedOrder.data, payment: paymentRes.data } });
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      setError(`Error processing payment: ${err.response?.data?.message || err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return (
    <div className="text-center p-8">
      <div className="text-red-500 mb-4">{error}</div>
      {error.includes('log in') && (
        <button 
          onClick={() => navigate('/login')}
          className="bg-[#42ADF5] text-white px-6 py-2 rounded-lg hover:bg-[#2C8ED1] transition-colors"
        >
          Go to Login
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-[#F1F2F7] min-h-screen text-[#36516C] p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-2xl font-bold mb-4">Pay Order</div>
                          <div className="text-3xl font-bold text-green-600 mb-6">LKR {totalData.total}.00</div>
          
          <div className="space-y-3">
            {cart.map((item) => {
              const product = getProductDetails(item.productId);
              return (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{product.name || item.productId} (Qty {item.quantity})</span>
                  <span>LKR {((product.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
            <div className="flex justify-between text-sm border-t pt-2">
              <span>Delivery Charge</span>
                              <span>LKR {totalData.deliveryFee}.00</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Pay with Card</h3>
          
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="Email"
              value={paymentInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="1234 1234 1234 1234"
                value={paymentInfo.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 pr-20"
              />
              <div className="absolute right-3 top-2 flex space-x-1">
                <div className="w-6 h-4 bg-red-500 rounded"></div>
                <div className="w-6 h-4 bg-blue-500 rounded"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="MM/YY"
                value={paymentInfo.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
              <input 
                type="text" 
                placeholder="CVC"
                value={paymentInfo.cvc}
                onChange={(e) => handleChange('cvc', e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>
            
            <input 
              type="text" 
              placeholder="Cardholder name"
              value={paymentInfo.cardholderName}
              onChange={(e) => handleChange('cardholderName', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
            
          
             
            
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button 
              onClick={handlePay}
              className="w-full bg-[#42ADF5] text-white py-3 rounded-lg hover:bg-[#2C8ED1] transition-colors"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;