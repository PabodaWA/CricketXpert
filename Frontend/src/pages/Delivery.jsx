import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUserId, isLoggedIn } from '../utils/getCurrentUser';
import { Search, User, ShoppingCart } from 'lucide-react';

const Delivery = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, totalData } = location.state || { cart: [], totalData: { subtotal: 0, deliveryFee: 450, total: 0 } };
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current logged-in user ID
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchUserDetails = async () => {
      // Check if user is logged in
      if (!isLoggedIn() || !userId) {
        console.log('User not logged in or no user ID:', { isLoggedIn: isLoggedIn(), userId });
        setError('Please log in to continue with checkout.');
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
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details. Please check the user ID or server connection.');
        setLoading(false);
      }
    };

    fetchUserDetails();
    console.log('Received state:', location.state);
    if (!location.state) {
      console.warn('No state passed to Delivery page. Cart and totalData are empty.');
    }
  }, [location.state, userId, navigate]);

  const handleProceedToPayment = () => {
    if (!user || cart.length === 0) {
      alert('User details are not loaded or cart is empty.');
      return;
    }
    const fullAddress = user.address || 'No address provided';
    navigate('/payment', { state: { cart, totalData, address: fullAddress } });
  };

  if (loading) return <div className="text-center p-8">Loading user details...</div>;
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
      {/* Header */}
      <nav className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="text-2xl font-bold text-[#072679]">CricketExpert.</div>
        <div className="flex space-x-6 text-gray-600">
          <span>home</span>
          <span>menu</span>
          <span>mobile app</span>
          <span>contact us</span>
        </div>
        <div className="flex items-center space-x-4">
          <Search className="w-5 h-5 text-gray-600" />
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <User className="w-5 h-5 text-gray-600" />
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delivery Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Delivery Information</h2>
            <div className="space-y-4">
              <p><strong>First Name:</strong> {user?.firstName || 'N/A'}</p>
              <p><strong>Last Name:</strong> {user?.lastName || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {user?.contactNumber || 'N/A'}</p>
              <p><strong>Address:</strong> {user?.address || 'No address provided'}</p>
            </div>
          </div>
        </div>

        {/* Cart Totals */}
        <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
          <h3 className="font-bold text-lg mb-4">Cart Totals</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
                              <span>LKR {totalData.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
                              <span>LKR {totalData.deliveryFee}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
                              <span>LKR {totalData.total}</span>
            </div>
          </div>
          <button 
            onClick={handleProceedToPayment}
            className="w-full bg-[#42ADF5] text-white py-3 rounded-lg mt-4 hover:bg-[#2C8ED1] transition-colors"
            disabled={!user || !cart.length}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Delivery;