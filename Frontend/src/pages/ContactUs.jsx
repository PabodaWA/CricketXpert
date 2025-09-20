import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Brand } from '../brand';
import cricketexpertLogo from '../assets/cricketexpert.png';

const ContactUs = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create new message object
    const newMessage = {
      id: Date.now(), // Simple ID generation
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: formData.comment,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      status: 'new',
      priority: 'medium'
    };

    // Get existing messages from localStorage
    const existingMessages = JSON.parse(localStorage.getItem('adminMessages') || '[]');
    
    // Add new message to the beginning of the array
    const updatedMessages = [newMessage, ...existingMessages];
    
    // Save to localStorage
    localStorage.setItem('adminMessages', JSON.stringify(updatedMessages));
    
    console.log('Form submitted:', formData);
    console.log('Message saved to admin messages:', newMessage);
    
    // Redirect to success page
    navigate('/contact-success');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: Brand.light }}>
      <Header />
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${Brand.secondary} 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, ${Brand.primary} 2px, transparent 2px),
                           linear-gradient(45deg, transparent 40%, ${Brand.accent}20 50%, transparent 60%)`,
          backgroundSize: '50px 50px, 50px 50px, 100px 100px'
        }}></div>
      </div>
      
      
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header Section */}
        <div className={`bg-white rounded-3xl shadow-2xl p-10 mb-8 transform transition-all duration-700 border-l-6 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ borderLeftColor: Brand.secondary }}>
          <div className="border-b-2 pb-8 mb-8" style={{ borderColor: Brand.secondary }}>
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110" style={{ backgroundColor: Brand.secondary + '20' }}>
                <svg className="w-10 h-10" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                       <h1
                         className="text-6xl font-bold"
                         style={{
                           color: Brand.primary
                         }}
                       >
                         Contact Us
                       </h1>
                <div className="w-32 h-1.5 rounded-full mt-3" style={{ background: `linear-gradient(90deg, ${Brand.secondary}, ${Brand.accent})` }}></div>
              </div>
            </div>
            <p 
              className="text-2xl font-medium flex items-center space-x-3"
              style={{ color: Brand.body }}
            >
              <span>Get in touch with our team</span>
              <span className="text-3xl">📞</span>
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Section - Contact Information */}
          <div className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            <div className="bg-white rounded-3xl shadow-2xl p-10 h-full">
              {/* Logo Section */}
              <div className="mb-10">
                <div className="flex items-center space-x-6 mb-8">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl overflow-hidden" style={{ backgroundColor: Brand.primary + '10' }}>
                    <img 
                      src={cricketexpertLogo} 
                      alt="CricketXpert Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold" style={{ color: Brand.primary }}>CricketXpert</h2>
                    <p className="text-xl font-semibold" style={{ color: Brand.accent }}>YOUR ULTIMATE CRICKET PARTNER</p>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg flex-shrink-0" style={{ backgroundColor: Brand.secondary + '20' }}>
                    <svg className="w-6 h-6" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: Brand.primary }}>CricketXpert (Sri Lanka)</h3>
                    <p className="text-lg leading-relaxed" style={{ color: Brand.body }}>
                      391, Gadabuwana Road<br />
                      Piliyandala, Colombo<br />
                      Sri Lanka
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg flex-shrink-0" style={{ backgroundColor: Brand.accent + '20' }}>
                    <svg className="w-6 h-6" style={{ color: Brand.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: Brand.primary }}>Timings:</h3>
                    <div className="space-y-2">
                      <p className="text-lg" style={{ color: Brand.body }}>
                        <span className="font-semibold">Weekdays:</span> 2 PM to 9 PM EST
                      </p>
                      <p className="text-lg" style={{ color: Brand.body }}>
                        <span className="font-semibold">Weekends:</span> 10 AM to 4 PM EST
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg flex-shrink-0" style={{ backgroundColor: Brand.primary + '20' }}>
                    <svg className="w-6 h-6" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: Brand.primary }}>Phone</h3>
                    <p className="text-lg font-semibold" style={{ color: Brand.secondary }}>+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg flex-shrink-0" style={{ backgroundColor: Brand.secondary + '20' }}>
                    <svg className="w-6 h-6" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: Brand.primary }}>Email</h3>
                    <p className="text-lg font-semibold" style={{ color: Brand.secondary }}>wenuxpc@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Contact Form */}
          <div className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
            <div className="bg-white rounded-3xl shadow-2xl p-10 h-full">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4" style={{ color: Brand.primary }}>Send us a Message</h2>
                <p className="text-lg" style={{ color: Brand.body }}>
                  Have a question or need assistance? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: Brand.primary }}>
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4"
                    style={{ 
                      borderColor: Brand.secondary + '30',
                      backgroundColor: Brand.light,
                      color: Brand.body,
                      focusRingColor: Brand.secondary + '20'
                    }}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: Brand.primary }}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4"
                    style={{ 
                      borderColor: Brand.secondary + '30',
                      backgroundColor: Brand.light,
                      color: Brand.body,
                      focusRingColor: Brand.secondary + '20'
                    }}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold mb-2" style={{ color: Brand.primary }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4"
                    style={{ 
                      borderColor: Brand.secondary + '30',
                      backgroundColor: Brand.light,
                      color: Brand.body,
                      focusRingColor: Brand.secondary + '20'
                    }}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="comment" className="block text-sm font-semibold mb-2" style={{ color: Brand.primary }}>
                    Comment
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 resize-none"
                    style={{ 
                      borderColor: Brand.secondary + '30',
                      backgroundColor: Brand.light,
                      color: Brand.body,
                      focusRingColor: Brand.secondary + '20'
                    }}
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-8 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 group"
                  style={{ backgroundColor: Brand.primary }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = Brand.primaryHover;
                    e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = Brand.primary;
                    e.target.style.transform = 'scale(1) translateY(0)';
                  }}
                >
                  <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="text-xl">Send Message</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className={`mt-12 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-10">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4" style={{ color: Brand.primary }}>Find Us</h2>
              <p className="text-lg" style={{ color: Brand.body }}>
                Visit our location in Colombo, Sri Lanka
              </p>
            </div>
            
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ minHeight: '400px' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.8937!2d79.8617!3d6.8034!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae25b0d1234567!2sCricketXpert!5e0!3m2!1sen!2slk!4v1640995200000!5m2!1sen!2slk"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="CricketXpert - Colombo, Sri Lanka"
              ></iframe>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-lg mb-4" style={{ color: Brand.body }}>
                CricketXpert, 391 Gadabuwana Road, Piliyandala, Colombo, Sri Lanka
              </p>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=CricketXpert+391+Gadabuwana+Road+Piliyandala+Colombo+Sri+Lanka"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: Brand.secondary }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = Brand.primaryHover;
                  e.target.style.transform = 'scale(1.05) translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = Brand.secondary;
                  e.target.style.transform = 'scale(1) translateY(0)';
                }}
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
      <Footer />
    </div>
  );
};

export default ContactUs;
