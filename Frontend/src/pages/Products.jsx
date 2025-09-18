import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCurrentUserId } from '../utils/getCurrentUser';
import bat1 from '../assets/Bat.webp';
import Accessories1 from '../assets/Accessories1.jpg';
import Electronics1 from '../assets/electronic.jpg';
import Gaming1 from '../assets/Gaming.jpg';
import Wearables1 from '../assets/Wearables.jpg';
import Ball1 from '../assets/ball.jpeg';
import Sports1 from '../assets/sports.jpg';
import cricket1 from '../assets/crikert.jpg';

const Products = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]); // Local cart state
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Get current logged-in user ID
  const userId = getCurrentUserId();

  const categoryImages = useMemo(
    () => ({
      Accessories: Accessories1,
      Bat: bat1,
      Ball: Ball1,
      Electronics: Electronics1,
      Gaming: Gaming1,
      Sports: Sports1,
      Wearables: Wearables1,
    }),
    []
  );

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchUserDetails();
  }, [selectedCategory, searchQuery]);

  // Listen for search events from Header component
  useEffect(() => {
    const handleSearch = (event) => {
      setSearchQuery(event.detail);
    };

    window.addEventListener('searchProducts', handleSearch);
    return () => window.removeEventListener('searchProducts', handleSearch);
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cricketCart', JSON.stringify(cart));
    
    // Update cart order in database when cart changes
    if (cart.length > 0) {
      updateCartOrder();
    } else {
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
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products/categories');
      setCategories(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err.response ? err.response.data : err.message);
      setCategories(['Accessories', 'Bat', 'Ball', 'Electronics', 'Gaming', 'Sports', 'Wearables']);
      setError('Failed to load categories. Showing default options.');
    }
  };

  const fetchProducts = async () => {
    try {
      const params = {
        page: 1,
        limit: 10,
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchQuery && { query: searchQuery }),
      };
      const res = await axios.get('http://localhost:5000/api/products/search', { params });
      setProducts(res.data.products || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err.response ? err.response.data : err.message);
      setProducts([]);
      setError('Failed to load products. Please try again.');
    }
  };

  // Create or update cart order in database
  const updateCartOrder = async () => {
    try {
      if (cart.length === 0) return;

      const orderItems = cart.map(item => {
        const product = products.find(p => p._id === item.productId);
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

      // Calculate total amount
      const subtotal = cart.reduce((sum, item) => {
        const product = products.find(p => p._id === item.productId);
        return sum + (product?.price || 0) * item.quantity;
      }, 0);
      const total = subtotal + 450; // Adding delivery charge

      const cartOrderData = {
        customerId: userId,
        items: orderItems,
        amount: total,
        address: user?.address || 'No address provided'
      };

      await axios.post('http://localhost:5000/api/orders/cart', cartOrderData);
      console.log('Cart order updated in database from Products page');
    } catch (err) {
      console.error('Error updating cart order from Products:', err);
      // Don't show error to user as this is background sync
    }
  };

  // Delete cart order from database
  const deleteCartOrder = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/orders/cart/${userId}`);
      console.log('Cart order deleted from database from Products page');
    } catch (err) {
      console.error('Error deleting cart order from Products:', err);
      // Don't show error to user as this is background sync
    }
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
          // Remove item if quantity becomes 0
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
        // Add new item with quantity 1
        newCart = [...prevCart, { productId, quantity: 1 }];
      } else {
        return prevCart; // No change if trying to decrease non-existent item
      }
      
      // Dispatch cart update event for header to update count
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      return newCart;
    });
  };

  const handleSearchChange = debounce((value) => {
    setSearchQuery(value);
  }, 300);

  const goToCart = () => {
    navigate('/cart', { state: { cart } }); // Pass cart state to Cart page
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-[#F1F2F7] min-h-screen text-[#36516C]">
      {/* Original Header Component */}
      <Header />

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 mx-8 my-4 rounded" role="alert">
          {error}
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#072679] to-[#42ADF5] text-white p-16 flex justify-between items-center">
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold mb-4">Order your favourite cricket equipment here</h1>
          <p className="text-lg mb-6">
            Choose from a diverse menu featuring a delectable array of cricket gears and skill development tools.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/products')}
              className="bg-white text-[#072679] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse All Products
            </button>
            <button
              onClick={() => navigate('/repair')}
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#072679] transition-colors"
            >
              Get Equipment Repaired
            </button>
          </div>
        </div>
        <img
          src={cricket1}
          alt="Cricket equipment"
          className="rounded-lg shadow-lg"
          onError={(e) => { e.target.src = 'https://placehold.co/500x300'; }}
        />
      </div>

      {/* Explore Menu (Category Circles) */}
      <section className="p-8 text-center">
        <h2 className="text-3xl font-bold text-[#072679] mb-4">Explore our menu</h2>
        <p className="text-[#36516C] mb-8 max-w-2xl mx-auto">
          Choose from a diverse selection of cricket equipment and skill development tools.
        </p>
        <div className="flex justify-center gap-8 flex-wrap">
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              className={`cursor-pointer text-center w-32 ${
                selectedCategory === cat ? 'border-4 border-[#42ADF5] rounded-full' : ''
              }`}
            >
              <img
                src={categoryImages[cat] || `https://placehold.co/100?text=${cat}`}
                alt={cat}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-2 shadow-md"
                onError={(e) => {
                  console.error(`Image load failed for category: ${cat}`);
                  e.target.src = `https://placehold.co/100?text=${cat}`;
                }}
              />
              <p className="text-[#000000] font-medium">{cat}</p>
            </div>
          ))}
        </div>
        
        {/* Search Bar */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search all products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42ADF5] focus:border-transparent text-gray-900"
            />
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Products Display */}
      <section className="p-8">
        <h2 className="text-3xl font-bold text-[#072679] mb-4 text-center">Top products near you</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <p className="text-center col-span-4">No products available matching your search or category.</p>
          ) : (
            products.map((product) => {
              const cartItem = cart.find(item => item.productId === product._id);
              const quantity = cartItem ? cartItem.quantity : 0;
              return (
                <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={product.image_url || 'https://placehold.co/600x500'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      console.error(`Product image failed for: ${product.name}`);
                      console.error(`Failed image URL: ${product.image_url}`);
                      e.target.src = 'https://placehold.co/300x200';
                    }}
                    onLoad={() => {
                      console.log(`Image loaded successfully for: ${product.name}`);
                      console.log(`Image URL: ${product.image_url}`);
                    }}
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-[#000000] mb-2">{product.name}</h3>
                    <p className="text-[#36516C] mb-2">{product.description?.slice(0, 100) || 'No description'}...</p>
                    <p className="text-[#072679] font-bold mb-4">LKR {product.price || 0}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(product._id, -1)}
                          className="bg-[#D88717] text-white px-3 py-1 rounded hover:bg-[#B36F14] disabled:bg-gray-300"
                          disabled={quantity === 0}
                        >
                          -
                        </button>
                        <span className="text-[#000000] font-medium">{quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(product._id, 1)}
                          className="bg-[#42ADF5] text-white px-3 py-1 rounded hover:bg-[#2C8ED1]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Products;