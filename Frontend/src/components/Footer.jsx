import React from 'react';
import { Link } from 'react-router-dom';
import cricketexpertLogo from '../assets/cricketexpert.png';

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white relative z-50">
      {/* Main Footer Content */}
      <div className="w-full mx-auto px-12 sm:px-16 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Company Information & Payment Methods */}
          <div className="space-y-4">
            {/* Logo and Company Name */}
                         <div className="flex items-center space-x-3">
               <img src={cricketexpertLogo} alt="CricketXpert Logo" className="h-12 w-auto" />
               <span className="text-xl font-bold" style={{ color: '#D88717' }}>CRICKET XPERT</span>
             </div>
            
            {/* Company Description */}
            <p className="text-sm text-gray-300 leading-relaxed">
              CricketXpert is a cricket-centric platform that offers comprehensive cricket services, 
              equipment, and training programs. We provide repair services, coaching programs, 
              ground bookings, and expert guidance for cricket enthusiasts of all levels.
            </p>
            
            {/* Payment Methods */}
            <div className="pt-4">
              <p className="text-sm font-medium mb-2">Payment Methods:</p>
              <div className="flex space-x-2">
                <div className="bg-white rounded px-2 py-1 text-xs font-bold text-blue-900">PayPal</div>
                <div className="bg-white rounded px-2 py-1 text-xs font-bold text-blue-900">Visa</div>
                <div className="bg-white rounded px-2 py-1 text-xs font-bold text-blue-900">MC</div>
                <div className="bg-white rounded px-2 py-1 text-xs font-bold text-blue-900">AMEX</div>
              </div>
            </div>
          </div>

                     {/* Column 2: Quick Links */}
                      <div className="space-y-4">
             <h3 className="text-lg font-bold" style={{ color: '#D88717' }}>Quick Links</h3>
                           <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/programs" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Coaching Programs
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/repair" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Repair
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Contact Us
                  </Link>
                </li>
              </ul>
           </div>

          {/* Column 3: Other Links */}
                     <div className="space-y-4">
             <h3 className="text-lg font-bold" style={{ color: '#D88717' }}>Other Links</h3>
                         <ul className="space-y-2">
               <li>
                 <Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors text-sm">
                   Privacy Policy
                 </Link>
               </li>
               <li>
                 <Link to="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                   Terms & Conditions
                 </Link>
               </li>
               <li>
                 <Link to="/faq" className="text-gray-300 hover:text-white transition-colors text-sm">
                   FAQ
                 </Link>
               </li>
               <li>
                 <Link to="/admin-messages" className="text-gray-300 hover:text-white transition-colors text-sm">
                   Admin Messages
                 </Link>
               </li>
             </ul>
          </div>

          {/* Column 4: Contact Us & Social Media */}
                     <div className="space-y-4">
             <h3 className="text-lg font-bold" style={{ color: '#D88717' }}>Contact Us</h3>
            <div className="space-y-3">
              {/* Address */}
                             <div className="flex items-start space-x-3">
                 <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#D88717' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-300">123 Cricket Lane, Sports City, CA 90210</span>
              </div>
              
              {/* Phone */}
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#D88717' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm text-gray-300">+1 (555) 123-4567</span>
              </div>
              
              {/* Email */}
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#D88717' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-300">info@cricketxpert.com</span>
              </div>
            </div>
            
            {/* Social Media Icons */}
            <div className="pt-4">
              <p className="text-sm font-medium mb-3">Follow Us:</p>
              <div className="flex space-x-3">
                <a href="#" className="text-gray-300 transition-colors" style={{ '--tw-text-opacity': '1' }} onMouseOver={(e) => e.target.style.color = '#D88717'} onMouseOut={(e) => e.target.style.color = '#D1D5DB'}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 transition-colors" style={{ '--tw-text-opacity': '1' }} onMouseOver={(e) => e.target.style.color = '#D88717'} onMouseOut={(e) => e.target.style.color = '#D1D5DB'}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 transition-colors" style={{ '--tw-text-opacity': '1' }} onMouseOver={(e) => e.target.style.color = '#D88717'} onMouseOut={(e) => e.target.style.color = '#D1D5DB'}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 transition-colors" style={{ '--tw-text-opacity': '1' }} onMouseOver={(e) => e.target.style.color = '#D88717'} onMouseOut={(e) => e.target.style.color = '#D1D5DB'}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Copyright Bar */}
      <div className="bg-gray-800 py-4">
        <div className="w-full mx-auto px-12 sm:px-16 lg:px-20">
          <div className="text-center">
            <p className="text-sm text-gray-300">
              © 2025 CricketXpert. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
