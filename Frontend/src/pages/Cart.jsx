import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Search, User, ShoppingCart, Minus, Plus } from 'lucide-react';
import { getCurrentUserId } from '../utils/getCurrentUser';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState(null);
  const [totalData, setTotalData] = useState({ subtotal: 0, deliveryFee: 450, total: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Get current logged-in user ID
  const userId = getCurrentUserId();

  useEffect(() => {
    // Load cart from localStorage on mount, use location.state if available
    const savedCart = JSON.parse(localStorage.getItem('cricketCart') || '[]');
    const cartFromState = location.state?.cart;
    const finalCart = cartFromState || savedCart;
    if (JSON.stringify(finalCart) !== JSON.stringify(cart)) {
      setCart(finalCart);
    }
    fetchProducts();
    fetchUserDetails();
  }, [location.state]);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cricketCart', JSON.stringify(cart));
    if (cart.length > 0) {
      calculateTotal();
      // Create/update cart order in database
      updateCartOrder();
    } else {
      setTotalData({ subtotal: 0, deliveryFee: 450, total: 450 });
      // Delete cart order from database if cart is empty
      deleteCartOrder();
    }
  }, [cart]);

  const fetchUserDetails = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      const response = await axios.get(`http://localhost:5000/api/users/profile`, config);
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching user details:', err);
      // Don't show error to user as this is background sync
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products/');
      setProducts(res.data || []);
      if (res.data.length === 0) {
        setError('No products available.');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products.');
    }
  };

  const getProductDetails = (productId) => {
    return products.find(product => product._id === productId) || {};
  };

  // Create or update cart order in database
  const updateCartOrder = async () => {
    try {
      if (cart.length === 0) return;

      const orderItems = cart.map(item => {
        const product = getProductDetails(item.productId);
        if (!product) {
          console.error('Product not found for item:', item.productId);
          return null;
        }
        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: product.price
        };
      }).filter(item => item !== null);

      const cartOrderData = {
        customerId: userId,
        items: orderItems,
        amount: totalData.total,
        address: user?.address || 'No address provided'
      };

      await axios.post('http://localhost:5000/api/orders/cart', cartOrderData);
      console.log('Cart order updated in database');
    } catch (err) {
      console.error('Error updating cart order:', err);
      // Don't show error to user as this is background sync
    }
  };

  // Delete cart order from database
  const deleteCartOrder = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/orders/cart/${userId}`);
      console.log('Cart order deleted from database');
    } catch (err) {
      console.error('Error deleting cart order:', err);
      // Don't show error to user as this is background sync
    }
  };

  const handleRemoveItem = (productId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.productId !== productId);
      // Dispatch cart update event for header to update count
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      return newCart;
    });
  };

  const handleQuantityChange = (productId, change) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.productId === productId);
      const product = products.find(p => p._id === productId);
      
      if (!product) return prevCart;
      
      let newCart;
      if (existingItem) {
        const newQuantity = existingItem.quantity + change;
        if (newQuantity <= 0) {
          newCart = prevCart.filter(item => item.productId !== productId);
        } else if (newQuantity > product.stock_quantity) {
          alert(`Only ${product.stock_quantity} items available in stock`);
          return prevCart;
        } else {
          newCart = prevCart.map(item =>
            item.productId === productId ? { ...item, quantity: newQuantity } : item
          );
        }
      } else if (change > 0) {
        if (product.stock_quantity <= 0) {
          alert('This product is out of stock');
          return prevCart;
        }
        newCart = [...prevCart, { productId, quantity: 1 }];
      } else {
        return prevCart;
      }
      
      // Dispatch cart update event for header to update count
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      return newCart;
    });
  };

  const calculateTotal = async () => {
    try {
      const orderItems = cart.map(item => {
        const product = getProductDetails(item.productId);
        if (!product) {
          console.error('Product not found for item:', item.productId);
          return null;
        }
        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: product.price
        };
      }).filter(item => item !== null);
      const res = await axios.post('http://localhost:5000/api/orders/calculate-total', {
        items: orderItems
      });
      setTotalData({
        subtotal: res.data.subtotal,
        deliveryFee: res.data.deliveryCharge,
        total: res.data.total
      });
    } catch (err) {
      console.error('Error calculating total:', err);
      alert('Error calculating total.');
    }
  };

  const handleProceedToDelivery = () => {
    navigate('/delivery', { state: { cart, totalData } });
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="bg-[#F1F2F7] min-h-screen text-[#36516C] p-8 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-[#F1F2F7] min-h-screen text-[#36516C] p-8">
      {/* Header */}
      <nav className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="text-2xl font-bold text-[#072679]">CricketExpert.</div>
        <div className="flex space-x-6 text-gray-600">
          <span className="border-b-2 border-[#42ADF5]">home</span>
          <span>menu</span>
          <span>mobile app</span>
          <span>contact us</span>
        </div>
        <div className="flex items-center space-x-4">
          <Search className="w-5 h-5 text-gray-600" />
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </div>
          <User className="w-5 h-5 text-gray-600" />
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="grid grid-cols-6 gap-4 text-gray-500 text-sm mb-4 pb-2 border-b">
              <span>Items</span>
              <span>Title</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
              <span>Remove</span>
            </div>
            
            {cart.length === 0 ? (
              <p className="text-center text-[#36516C]">Your cricket gear cart is empty.</p>
            ) : (
              cart.map((item) => {
                const product = getProductDetails(item.productId);
                return (
                  <div key={item.productId} className="grid grid-cols-6 gap-4 items-center py-4 border-b">
                    <img 
                      src={product.image_url || 'https://placehold.co/50x50'} 
                      alt={product.name} 
                      className="w-10 h-10 object-cover rounded" 
                    />
                    <div className="font-medium">{product.name || 'Unknown Product'}</div>
                    <div>LKR {product.price || 0}</div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleQuantityChange(item.productId, -1)}
                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.productId, 1)}
                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div>LKR {(product.price || 0) * item.quantity}</div>
                    <button 
                      onClick={() => handleRemoveItem(item.productId)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>
        </div>

        {/* Cart Totals */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
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
              onClick={handleProceedToDelivery}
              className="w-full bg-[#42ADF5] text-white py-3 rounded-lg mt-4 hover:bg-[#2C8ED1] transition-colors"
              disabled={cart.length === 0}
            >
              PROCEED TO CHECKOUT
            </button>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default Cart;