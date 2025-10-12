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
import cricket1 from '../assets/banner.png';

const Products = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]); // Local cart state
  const [cartToken, setCartToken] = useState('');
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // For image modal
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
    // Ensure cartToken exists for session
    let token = localStorage.getItem('cartToken');
    if (!token) {
      token = `${userId || 'guest'}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
      localStorage.setItem('cartToken', token);
    }
    setCartToken(token);
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

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && selectedImage) {
        closeImageModal();
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cricketCart', JSON.stringify(cart));
    
    // Sync each cart item to Cart_Pending
    if (cartToken) {
      if (cart.length > 0) {
        syncCartPending();
      } else {
        clearCartPending();
      }
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

  // Sync local cart to Cart_Pending table
  const syncCartPending = async () => {
    try {
      for (const item of cart) {
        const product = products.find(p => p._id === item.productId);
        if (!product) continue;
        await axios.post('http://localhost:5000/api/cart-pending', {
          cartToken: cartToken,
          productId: item.productId,
          title: product.name,
          price: product.price,
          quantity: item.quantity
        });
      }
    } catch (err) {
      console.error('Error syncing Cart_Pending:', err);
    }
  };

  const clearCartPending = async () => {
    try {
      if (!cartToken) return;
      await axios.delete(`http://localhost:5000/api/cart-pending/${cartToken}`);
    } catch (err) {
      console.error('Error clearing Cart_Pending:', err);
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

  // Image modal functions
  const openImageModal = (imageUrl, productName) => {
    setSelectedImage({ url: imageUrl, name: productName });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="bg-[#F1F2F7] min-h-screen text-[#36516C]">
      {/* Original Header Component */}
      <Header />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mx-8 my-4 rounded-r-lg shadow-sm" role="alert">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          {error}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#072679] via-[#1a3a8a] to-[#42ADF5] text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Premium Cricket
                  <span className="block text-[#42ADF5]">Equipment</span>
                </h1>
                <p className="text-xl text-gray-200 leading-relaxed max-w-2xl">
                  Discover our curated collection of professional-grade cricket equipment, 
                  designed to elevate your game to the next level.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/products')}
                  className="bg-white text-[#072679] px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center">
                    Explore Products
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
            </button>
            <button
              onClick={() => navigate('/repair')}
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[#072679] transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center justify-center">
                    Equipment Repair
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
            </button>
          </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#42ADF5]">500+</div>
                  <div className="text-sm text-gray-300">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#42ADF5]">1000+</div>
                  <div className="text-sm text-gray-300">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#42ADF5]">24/7</div>
                  <div className="text-sm text-gray-300">Support</div>
                </div>
              </div>
        </div>
            
            {/* Image */}
            <div className="relative">
              <div className="relative z-10">
        <img
          src={cricket1}
                  alt="Premium Cricket Equipment"
                  className="w-full h-auto rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://placehold.co/500x300'; }}
        />
      </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#42ADF5] rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#D88717] rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#072679] mb-4">Shop by Category</h2>
            <p className="text-xl text-[#36516C] max-w-3xl mx-auto leading-relaxed">
              Discover our carefully curated collection of premium cricket equipment, 
              organized by category for your convenience.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-8 mb-16">
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                className={`group cursor-pointer text-center transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === cat 
                    ? 'ring-4 ring-[#42ADF5] ring-opacity-50 rounded-full p-4' 
                    : 'hover:shadow-lg rounded-full p-4'
                }`}
              >
                <div className="relative">
                  <div className={`w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-lg transition-all duration-300 ${
                    selectedCategory === cat ? 'ring-4 ring-[#42ADF5]' : 'group-hover:shadow-xl'
                  }`}>
              <img
                src={categoryImages[cat] || `https://placehold.co/100?text=${cat}`}
                alt={cat}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  console.error(`Image load failed for category: ${cat}`);
                  e.target.src = `https://placehold.co/100?text=${cat}`;
                }}
              />
                  </div>
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full transition-all duration-300 ${
                    selectedCategory === cat ? 'bg-[#42ADF5]' : 'bg-[#D88717] opacity-0 group-hover:opacity-100'
                  }`}>
                    <svg className="w-5 h-5 text-white m-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className={`font-semibold text-lg transition-colors duration-300 ${
                  selectedCategory === cat ? 'text-[#42ADF5]' : 'text-[#000000] group-hover:text-[#072679]'
                }`}>
                  {cat}
                </p>
            </div>
          ))}
        </div>
        
          {/* Enhanced Search Bar */}
          <div className="max-w-2xl mx-auto">
          <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-6 w-6 text-[#36516C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            <input
              type="text"
                placeholder="Search for cricket equipment, brands, or specific items..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#42ADF5] focus:ring-opacity-20 focus:border-[#42ADF5] text-lg text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md transition-all duration-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <svg className="h-6 w-6 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Search Results Count */}
            {searchQuery && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[#42ADF5] text-white">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
                  {products.length} products found for "{searchQuery}"
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products Display */}
      <section className="py-16 bg-[#072679]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              {selectedCategory ? `${selectedCategory} Products` : 'Featured Products'}
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              {selectedCategory 
                ? `Discover our premium ${selectedCategory.toLowerCase()} collection`
                : 'Handpicked cricket equipment for every player'
              }
            </p>
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Products Found</h3>
                <p className="text-gray-200 mb-6">
                  {searchQuery 
                    ? `No products match your search for "${searchQuery}"`
                    : 'No products available in this category at the moment.'
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                  }}
                  className="bg-[#42ADF5] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2C8ED1] transition-colors"
                >
                  View All Products
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => {
              const cartItem = cart.find(item => item.productId === product._id);
              const quantity = cartItem ? cartItem.quantity : 0;
              const stockQuantity = product.stock_quantity || product.stock || 0;
              const isOutOfStock = stockQuantity <= 0;
              
              return (
                  <div key={product._id} className="group bg-blue-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    {/* Product Image */}
                  <div 
                      className="relative cursor-pointer overflow-hidden"
                    onClick={() => openImageModal(product.image_url || 'https://placehold.co/600x500', product.name)}
                  >
                      <div className="aspect-w-4 aspect-h-3 bg-blue-100">
                    <img
                      src={product.image_url || 'https://placehold.co/600x500'}
                      alt={product.name}
                          className="w-full h-64 object-contain group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        console.error(`Product image failed for: ${product.name}`);
                        e.target.src = 'https://placehold.co/300x200';
                      }}
                        />
                      </div>
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                            </div>
                            <span className="text-white text-sm font-medium">Click to view</span>
                      </div>
                    </div>
                  </div>
                  
                      {/* Stock Badge */}
                      <div className="absolute top-4 right-4">
                      {isOutOfStock ? (
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          Out of Stock
                        </span>
                      ) : (
                          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            In Stock
                        </span>
                      )}
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-[#000000] mb-2 line-clamp-2 group-hover:text-[#072679] transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-[#36516C] text-sm line-clamp-2 leading-relaxed">
                          {product.description?.slice(0, 120) || 'Premium cricket equipment for enhanced performance.'}...
                        </p>
                      </div>
                      
                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-bold text-[#072679]">LKR {product.price || 0}</span>
                          {stockQuantity > 0 && (
                            <span className="text-sm text-[#36516C]">({stockQuantity} available)</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => handleQuantityChange(product._id, -1)}
                            className="w-10 h-10 bg-[#D88717] text-white rounded-xl hover:bg-[#B36F14] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-bold"
                            disabled={quantity === 0}
                          >
                            −
                          </button>
                          <span className="text-lg font-semibold text-[#000000] min-w-[2rem] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(product._id, 1)}
                            className="w-10 h-10 bg-[#42ADF5] text-white rounded-xl hover:bg-[#2C8ED1] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-bold"
                            disabled={isOutOfStock}
                          >
                            +
                          </button>
                        </div>
                        
                        <button
                          onClick={() => navigate('/buy', { state: { product } })}
                          className="w-full bg-[#072679] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#051A5C] transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                          disabled={isOutOfStock}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                          </svg>
                          <span>{isOutOfStock ? 'Out of Stock' : 'Buy Now'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
          )}
        </div>
      </section>
      
      {/* Enhanced Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div 
            className="relative max-w-6xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#072679] to-[#42ADF5] text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{selectedImage.name}</h3>
            <button
              onClick={closeImageModal}
                  className="bg-white/20 backdrop-blur-sm text-white rounded-full p-3 hover:bg-white/30 transition-all duration-200 transform hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
              </div>
            </div>
            
            {/* Image Container */}
            <div className="p-8 bg-gray-50">
              <div className="flex justify-center items-center min-h-[60vh]">
                <div className="relative group">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                    className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-lg group-hover:shadow-2xl transition-shadow duration-300"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/600x400?text=Image+Not+Available';
                  }}
                />
                  
                  {/* Image Actions */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedImage.url;
                          link.download = selectedImage.name;
                          link.click();
                        }}
                        className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-3 hover:bg-white transition-all duration-200 shadow-lg"
                        title="Download Image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedImage.url);
                          // You could add a toast notification here
                        }}
                        className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-3 hover:bg-white transition-all duration-200 shadow-lg"
                        title="Copy Image URL"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-white p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#36516C]">
                  Click outside or press ESC to close
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={closeImageModal}
                    className="bg-[#36516C] text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#2a3f52] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => navigate('/buy', { state: { product: products.find(p => p.name === selectedImage.name) } })}
                    className="bg-[#42ADF5] text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#2C8ED1] transition-colors"
                  >
                    Buy This Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Products;