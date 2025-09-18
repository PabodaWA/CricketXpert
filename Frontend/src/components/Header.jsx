import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import bellIcon from '../assets/bell-icon.svg';
import cricketexpertLogo from '../assets/cricketexpert.png';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [repairDropdownOpen, setRepairDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Update cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cricketCart') || '[]');
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      } catch (error) {
        console.error('Error reading cart from localStorage:', error);
        setCartCount(0);
      }
    };

    // Initial load
    updateCartCount();

    // Listen for cart changes
    window.addEventListener('cartUpdated', updateCartCount);
    
    // Also check periodically in case localStorage is updated elsewhere
    const interval = setInterval(updateCartCount, 1000);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Products' },
    { path: '/coaching', label: 'Coaching Program' },
    { path: '/ground-booking', label: 'Ground Booking' },
  ];

  const handleMyRequestClick = () => {
    try {
      const u = JSON.parse(localStorage.getItem('cx_current_user') || 'null');
      if (u?.id) {
        navigate(`/dashboard/${u.id}`);
      } else {
        navigate('/repair');
      }
    } catch {
      navigate('/repair');
    }
    setRepairDropdownOpen(false);
  };

  const handleProfileClick = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      if (userInfo.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/profile');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="shadow-lg w-full">
      {/* Top section - Dark blue background */}
      <div className="bg-blue-900 h-20 relative w-full">
        <div className="w-full mx-auto px-12 sm:px-16 lg:px-20 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <img src={cricketexpertLogo} alt="CricketXpert Logo" className="h-20 w-auto" />
            </div>

            {/* Center - Navigation Items */}
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  to={item.path}
                  key={item.label}
                  className={`px-6 py-3 rounded text-white text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-white bg-opacity-20'
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Repair Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setRepairDropdownOpen(!repairDropdownOpen)}
                  className={`px-6 py-3 rounded text-white text-base font-medium transition-colors flex items-center space-x-2
                    ${location.pathname === '/repair' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'}`}
                >
                  <span>Repair</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {repairDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <Link
                        to="/repair"
                        className="block px-4 py-2 text-gray-900 hover:bg-gray-100 transition-colors"
                        onClick={() => setRepairDropdownOpen(false)}
                      >
                        New Request
                      </Link>
                      <button
                        onClick={handleMyRequestClick}
                        className="block w-full text-left px-4 py-2 text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        My Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Icons */}
            <div className="flex items-center space-x-6">
              {/* Cart Icon */}
              <button 
                onClick={() => navigate('/cart')}
                className="relative p-3 text-white hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                {/* Cart Badge */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              </button>

              {/* Notification Icon */}
              <button className="relative p-3 text-white hover:bg-white hover:bg-opacity-10 rounded-full transition-colors">
                <img src={bellIcon} alt="Notifications" className="w-7 h-7" />
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Profile Icon */}
              <button 
                onClick={handleProfileClick}
                className="p-3 text-white hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
              >
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom section - Light gray background */}
      <div className="bg-gray-200 h-4 w-full"></div>
    </header>
  );
};

export default Header;