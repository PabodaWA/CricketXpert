import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUserId, isLoggedIn } from '../utils/getCurrentUser';
import { Pencil, Check, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Delivery = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, totalData, singleProduct, quantity, cartToken } = location.state || { cart: [], totalData: { subtotal: 0, deliveryFee: 450, total: 0 }, cartToken: localStorage.getItem('cartToken') || '' };
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editedUser, setEditedUser] = useState({});

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
        setEditedUser({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          contactNumber: response.data.contactNumber || '',
          address: response.data.address || ''
        });
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
    navigate('/payment', { state: { cart, totalData, address: fullAddress, cartToken } });
  };

  const handleEdit = (field) => {
    setEditingField(field);
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const handleSave = async (field) => {
    if (field === 'email') {
      alert('Email cannot be changed here. Please contact support or an admin.');
      return;
    }
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
          'Content-Type': 'application/json'
        }
      };
      const payload = { [field]: editedUser[field] };
      const { data } = await axios.put(`http://localhost:5000/api/users/profile`, payload, config);
      setUser(data);
      setEditedUser({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        contactNumber: data.contactNumber || '',
        address: data.address || ''
      });
      setEditingField(null);
    } catch (e) {
      console.error('Failed to save user field', field, e);
      alert('Failed to save changes. Please try again.');
    }
  };

  if (loading) return <div className="text-center p-8">Loading user details...</div>;
  if (error) return (
    <div className="text-center p-8">
      <div className="text-red-500 mb-4">{error}</div>
      {error.includes('log in') && (
        <button 
          onClick={() => navigate('/login')}
          className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
          Go to Login
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen text-gray-900">
      <Header />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
        {/* Delivery Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Customer Information</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-3 pr-4">Field</th>
                    <th className="py-3 pr-4">Value</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-semibold">First Name</td>
                    <td className="py-3 pr-4">
                      {editingField === 'firstName' ? (
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                          value={editedUser.firstName}
                          onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                        />
                      ) : (
                        <span>{user?.firstName || 'N/A'}</span>
                      )}
                    </td>
                    <td className="py-3">
                      {editingField === 'firstName' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave('firstName')}
                            className="p-2 rounded border border-blue-900 bg-blue-900 text-white hover:bg-blue-800"
                            aria-label="Save first name"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 rounded border text-gray-700 hover:bg-gray-100"
                            aria-label="Cancel editing"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit('firstName')}
                          className="p-2 rounded border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors"
                          aria-label="Edit first name"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-semibold">Last Name</td>
                    <td className="py-3 pr-4">
                      {editingField === 'lastName' ? (
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                          value={editedUser.lastName}
                          onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                        />
                      ) : (
                        <span>{user?.lastName || 'N/A'}</span>
                      )}
                    </td>
                    <td className="py-3">
                      {editingField === 'lastName' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave('lastName')}
                            className="p-2 rounded border border-blue-900 bg-blue-900 text-white hover:bg-blue-800"
                            aria-label="Save last name"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 rounded border text-gray-700 hover:bg-gray-100"
                            aria-label="Cancel editing"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit('lastName')}
                          className="p-2 rounded border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors"
                          aria-label="Edit last name"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-semibold">Email</td>
                    <td className="py-3 pr-4">
                      {editingField === 'email' ? (
                        <input
                          type="email"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                          value={editedUser.email}
                          onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                        />
                      ) : (
                        <span>{user?.email || 'N/A'}</span>
                      )}
                    </td>
                    <td className="py-3">
                      {editingField === 'email' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave('email')}
                            className="p-2 rounded border border-blue-900 bg-blue-900 text-white hover:bg-blue-800"
                            aria-label="Save email"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 rounded border text-gray-700 hover:bg-gray-100"
                            aria-label="Cancel editing"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit('email')}
                          className="p-2 rounded border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors"
                          aria-label="Edit email"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-semibold">Phone</td>
                    <td className="py-3 pr-4">
                      {editingField === 'contactNumber' ? (
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                          value={editedUser.contactNumber}
                          onChange={(e) => setEditedUser({ ...editedUser, contactNumber: e.target.value })}
                        />
                      ) : (
                        <span>{user?.contactNumber || 'N/A'}</span>
                      )}
                    </td>
                    <td className="py-3">
                      {editingField === 'contactNumber' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave('contactNumber')}
                            className="p-2 rounded border border-blue-900 bg-blue-900 text-white hover:bg-blue-800"
                            aria-label="Save phone"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 rounded border text-gray-700 hover:bg-gray-100"
                            aria-label="Cancel editing"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit('contactNumber')}
                          className="p-2 rounded border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors"
                          aria-label="Edit phone"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">Address</td>
                    <td className="py-3 pr-4">
                      {editingField === 'address' ? (
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                          value={editedUser.address}
                          onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                        />
                      ) : (
                        <span>{user?.address || 'No address provided'}</span>
                      )}
                    </td>
                    <td className="py-3">
                      {editingField === 'address' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave('address')}
                            className="p-2 rounded border border-blue-900 bg-blue-900 text-white hover:bg-blue-800"
                            aria-label="Save address"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 rounded border text-gray-700 hover:bg-gray-100"
                            aria-label="Cancel editing"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit('address')}
                          className="p-2 rounded border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors"
                          aria-label="Edit address"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Single Product Details (when coming from BuyPage) */}
          {singleProduct && (
            <div className="bg-white rounded-lg p-6 shadow-sm mt-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="flex items-center space-x-4">
                <img
                  src={singleProduct.image_url || 'https://placehold.co/100x100'}
                  alt={singleProduct.name}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/100x100';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{singleProduct.name}</h3>
                  <p className="text-gray-600">Quantity: {quantity}</p>
                  <p className="text-[#072679] font-bold">LKR {singleProduct.price?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
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
            className="w-full bg-blue-900 text-white py-3 rounded-lg mt-4 hover:bg-blue-800 transition-colors"
            disabled={!user || !cart.length}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Delivery;