import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUserId } from '../utils/getCurrentUser';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BuyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { product } = location.state || {};
  const [quantity, setQuantity] = useState(1);
  const [cartToken, setCartToken] = useState('');
  const [loading, setLoading] = useState(false);

  // Get current logged-in user ID
  const userId = getCurrentUserId();

  useEffect(() => {
    if (!product) {
      // If no product data is passed, redirect back to products page
      navigate('/products');
    } else {
      // Initialize cart token
      let token = localStorage.getItem('cartToken');
      if (!token) {
        token = `${userId || 'guest'}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
        localStorage.setItem('cartToken', token);
      }
      setCartToken(token);
    }
  }, [product, navigate, userId]);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock_quantity || 999)) {
      setQuantity(newQuantity);
    }
  };

  const handleNextToDelivery = async () => {
    if (!product || !cartToken) return;
    
    setLoading(true);
    try {
      // Add product to cart in localStorage
      const currentCart = JSON.parse(localStorage.getItem('cricketCart') || '[]');
      const existingItemIndex = currentCart.findIndex(item => item.productId === product._id);
      
      let updatedCart;
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedCart = [...currentCart];
        updatedCart[existingItemIndex].quantity = quantity;
      } else {
        // Add new item
        updatedCart = [...currentCart, {
          productId: product._id,
          quantity: quantity
        }];
      }
      
      localStorage.setItem('cricketCart', JSON.stringify(updatedCart));
      
      // Sync to Cart_Pending backend
      await axios.post('http://localhost:5000/api/cart-pending', {
        cartToken: cartToken,
        productId: product._id,
        title: product.name,
        price: product.price,
        quantity: quantity
      });
      
      // Create a cart-like structure for the single product (for delivery page)
      const cart = [{
        productId: product._id,
        quantity: quantity
      }];

      // Calculate totals
      const subtotal = product.price * quantity;
      const deliveryFee = 450;
      const total = subtotal + deliveryFee;

      const totalData = {
        subtotal,
        deliveryFee,
        total
      };

      // Navigate to delivery page with the product data and cartToken
      navigate('/delivery', { 
        state: { 
          cart, 
          totalData,
          singleProduct: product,
          quantity,
          cartToken
        } 
      });
    } catch (error) {
      console.error('Error adding product to cart:', error);
      alert('Error adding product to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="bg-[#F1F2F7] min-h-screen text-[#36516C] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Product Selected</h2>
          <p className="mb-4">Please select a product to continue.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-[#42ADF5] text-white px-6 py-3 rounded-lg hover:bg-[#2C8ED1] transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F1F2F7] min-h-screen text-[#36516C]">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button 
              onClick={() => navigate('/products')}
              className="hover:text-[#42ADF5] transition-colors"
            >
              Products
            </button>
            <span>/</span>
            <span className="text-[#072679] font-medium">Buy Now</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-w-4 aspect-h-3 relative">
              <img
                src={product.image_url || 'https://placehold.co/600x500'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/600x500';
                }}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-[#072679] mb-4">{product.name}</h1>
            
            <div className="mb-6">
              <p className="text-lg text-[#36516C] leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-2xl font-bold text-[#072679] mb-2">
                LKR {product.price?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600">
                Stock: {product.stock_quantity || 0} available
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="bg-[#D88717] text-white px-4 py-2 rounded-lg hover:bg-[#B36F14] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="text-2xl font-bold text-[#072679] min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="bg-[#42ADF5] text-white px-4 py-2 rounded-lg hover:bg-[#2C8ED1] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={quantity >= (product.stock_quantity || 999)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Price per item:</span>
                <span className="font-semibold">LKR {product.price?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold">{quantity}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">LKR {(product.price * quantity)?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-semibold">LKR 450</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#072679]">Total:</span>
                <span className="text-lg font-bold text-[#072679]">
                  LKR {((product.price * quantity) + 450)?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextToDelivery}
              disabled={loading}
              className="w-full bg-[#42ADF5] text-white py-4 rounded-lg hover:bg-[#2C8ED1] transition-colors font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding to Cart...' : 'Next: Delivery'}
            </button>

            {/* Back to Products Button */}
            <button
              onClick={() => navigate('/products')}
              className="w-full mt-3 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BuyPage;
