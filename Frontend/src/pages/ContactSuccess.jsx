import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Brand } from '../brand';

const ContactSuccess = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
      
      
      {/* Hero Section - Contact Success */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-left">
            <div className="space-y-8 max-w-4xl">
              <div className="relative">
                <h1 className="text-5xl lg:text-6xl font-bold mb-4" style={{ color: '#000000' }}>
                  Message Sent!
                </h1>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
              </div>
              <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                Thank you for contacting us! We have received your message and will get back to you as soon as possible. We appreciate your interest in our cricket services.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">

        {/* Success Content */}
        <div className={`bg-white rounded-3xl shadow-2xl p-10 mb-8 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
          <div className="text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl" style={{ backgroundColor: Brand.secondary + '20' }}>
              <svg className="w-12 h-12" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-4xl font-bold mb-6" style={{ color: Brand.primary }}>
              Your Message Has Been Received
            </h2>
            
            <div className="w-24 h-1 rounded-full mx-auto mb-8" style={{ background: `linear-gradient(90deg, ${Brand.secondary}, ${Brand.accent})` }}></div>
            
            <p className="text-xl mb-8 leading-relaxed" style={{ color: Brand.body }}>
              Thank you for reaching out to CricketXpert! We have successfully received your message and our team will get back to you as soon as possible.
            </p>
            
            <div className="bg-gradient-to-r p-8 rounded-2xl mb-8 shadow-lg" style={{ 
              background: `linear-gradient(135deg, ${Brand.secondary}15, ${Brand.primary}10, ${Brand.accent}05)`,
              border: `2px solid ${Brand.secondary}30`
            }}>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: Brand.accent + '20' }}>
                  <svg className="w-6 h-6" style={{ color: Brand.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold" style={{ color: Brand.primary }}>What Happens Next?</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: Brand.primary + '20' }}>
                    <span className="text-2xl font-bold" style={{ color: Brand.primary }}>1</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2" style={{ color: Brand.primary }}>Message Review</h4>
                  <p className="text-sm" style={{ color: Brand.body }}>Our team will review your message and understand your requirements.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: Brand.secondary + '20' }}>
                    <span className="text-2xl font-bold" style={{ color: Brand.secondary }}>2</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2" style={{ color: Brand.primary }}>Response Preparation</h4>
                  <p className="text-sm" style={{ color: Brand.body }}>We'll prepare a detailed response with relevant information and solutions.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: Brand.accent + '20' }}>
                    <span className="text-2xl font-bold" style={{ color: Brand.accent }}>3</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2" style={{ color: Brand.primary }}>Get Back to You</h4>
                  <p className="text-sm" style={{ color: Brand.body }}>We'll contact you within 24 hours with our response.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={`bg-white rounded-3xl shadow-2xl p-10 mb-8 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4" style={{ color: Brand.primary }}>Need Immediate Assistance?</h2>
            <p className="text-lg" style={{ color: Brand.body }}>
              If you have urgent questions, feel free to contact us directly
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" style={{ backgroundColor: Brand.secondary + '10' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: Brand.secondary + '20' }}>
                <svg className="w-8 h-8" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: Brand.primary }}>Phone</h3>
              <p className="text-lg font-semibold" style={{ color: Brand.secondary }}>+1 (555) 123-4567</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" style={{ backgroundColor: Brand.accent + '10' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: Brand.accent + '20' }}>
                <svg className="w-8 h-8" style={{ color: Brand.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: Brand.primary }}>Email</h3>
              <p className="text-lg font-semibold" style={{ color: Brand.accent }}>wenuxpc@gmail.com</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" style={{ backgroundColor: Brand.primary + '10' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: Brand.primary + '20' }}>
                <svg className="w-8 h-8" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: Brand.primary }}>Response Time</h3>
              <p className="text-lg font-semibold" style={{ color: Brand.primary }}>Within 24 Hours</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`text-center transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/contact"
              className="px-10 py-5 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 group"
              style={{ backgroundColor: Brand.secondary }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = Brand.primaryHover;
                e.target.style.transform = 'scale(1.1) translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = Brand.secondary;
                e.target.style.transform = 'scale(1) translateY(0)';
              }}
            >
              <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xl">Send Another Message</span>
            </Link>
            
            <Link 
              to="/"
              className="px-10 py-5 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 group"
              style={{ backgroundColor: Brand.accent }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1) translateY(-2px)';
                e.target.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1) translateY(0)';
                e.target.style.filter = 'brightness(1)';
              }}
            >
              <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xl">Back to Home</span>
            </Link>
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

export default ContactSuccess;
