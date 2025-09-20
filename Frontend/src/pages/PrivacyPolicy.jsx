import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Brand } from '../brand';

const PrivacyPolicy = () => {
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
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: Brand.secondary }}></div>
      <div className="absolute top-40 right-20 w-16 h-16 rounded-full opacity-10 animate-bounce" style={{ backgroundColor: Brand.accent }}></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: Brand.primary }}></div>
      
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Header Section */}
        <div className={`bg-white rounded-2xl shadow-2xl p-8 mb-8 transform transition-all duration-700 border-l-4 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ borderLeftColor: Brand.secondary }}>
          <div className="border-b-2 pb-6 mb-6" style={{ borderColor: Brand.secondary }}>
            <nav className="text-sm mb-4 flex items-center">
              <span className="px-4 py-2 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-shadow duration-300" style={{ backgroundColor: Brand.secondary + '20', color: Brand.primary }}>
                🏠 Home / Privacy Policy
              </span>
            </nav>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110" style={{ backgroundColor: Brand.secondary + '20' }}>
                <svg className="w-8 h-8" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 
                  className="text-5xl font-bold bg-gradient-to-r animate-pulse"
                  style={{ 
                    background: `linear-gradient(135deg, ${Brand.primary}, ${Brand.secondary}, ${Brand.accent})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    backgroundSize: '200% 200%',
                    animation: 'gradient 3s ease infinite'
                  }}
                >
                  Privacy Policy
                </h1>
                <div className="w-24 h-1 rounded-full mt-2" style={{ background: `linear-gradient(90deg, ${Brand.secondary}, ${Brand.accent})` }}></div>
              </div>
            </div>
            <p 
              className="text-xl font-medium flex items-center space-x-2"
              style={{ color: Brand.body }}
            >
              <span>Welcome to CricketXpert!</span>
              <span className="text-2xl animate-bounce">🏏</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-r p-8 rounded-2xl mb-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2" style={{ 
            background: `linear-gradient(135deg, ${Brand.secondary}15, ${Brand.primary}10, ${Brand.accent}05)`,
            borderColor: Brand.secondary + '30'
          }}>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: Brand.secondary + '30' }}>
                <svg className="w-4 h-4" style={{ color: Brand.primary }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: Brand.body }}
              >
                CricketXpert respects each individual's right to personal privacy. We will collect and use information through our Web site only in the ways disclosed in this statement. This statement applies solely to information collected at CricketXpert's Web site.
              </p>
            </div>
          </div>
        </div>

        {/* Part I: Information Collection */}
        <div className={`bg-white rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-500 border-t-4 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ borderTopColor: Brand.secondary, transitionDelay: '100ms' }}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110" style={{ backgroundColor: Brand.primary }}>
              <span className="animate-pulse">1</span>
            </div>
            <div>
              <h2 
                className="text-2xl font-bold"
                style={{ color: Brand.primary }}
              >
                INFORMATION COLLECTION
              </h2>
              <div className="w-16 h-0.5 rounded-full mt-1" style={{ background: `linear-gradient(90deg, ${Brand.primary}, ${Brand.secondary})` }}></div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]" style={{ 
              background: `linear-gradient(135deg, ${Brand.secondary}08, ${Brand.primary}05)`,
              border: `1px solid ${Brand.secondary}20`
            }}>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm" style={{ backgroundColor: Brand.secondary + '20' }}>
                  <svg className="w-4 h-4" style={{ color: Brand.primary }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: Brand.body }}
                >
                  CricketXpert collects information through our Web site at several points. We collect the following information about primary visitors: <strong className="px-2 py-1 rounded" style={{ backgroundColor: Brand.secondary + '20', color: Brand.primary }}>Name, address, email, and phone</strong> when an order is made with us.
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]" style={{ 
              background: `linear-gradient(135deg, ${Brand.accent}08, ${Brand.primary}05)`,
              border: `1px solid ${Brand.accent}20`
            }}>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm" style={{ backgroundColor: Brand.accent + '20' }}>
                  <svg className="w-4 h-4" style={{ color: Brand.accent }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: Brand.body }}
                >
                  CricketXpert does not actively market to children, and we never knowingly ask a child under <strong className="px-2 py-1 rounded" style={{ backgroundColor: Brand.accent + '20', color: Brand.accent }}>13</strong> to divulge personal information.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Part II: Information Usage */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 border-t-4" style={{ borderTopColor: Brand.accent }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: Brand.accent }}>
              2
            </div>
            <h2 
              className="text-2xl font-bold"
              style={{ color: Brand.primary }}
            >
              INFORMATION USAGE
            </h2>
          </div>
          
          <div className="bg-gradient-to-r p-6 rounded-xl" style={{ 
            background: `linear-gradient(135deg, ${Brand.accent}08, ${Brand.secondary}05)`,
            border: `1px solid ${Brand.accent}20`
          }}>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: Brand.accent + '20' }}>
                <svg className="w-3 h-3" style={{ color: Brand.accent }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: Brand.body }}
              >
                Personal information that we gather is used solely for <strong>identification and order purposes</strong> and for managing online accounts. CricketXpert does not sell or otherwise exploit personal information to third parties without your explicit consent.
              </p>
            </div>
          </div>
        </div>

        {/* SMS Marketing and Communication */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 border-t-4" style={{ borderTopColor: Brand.secondary }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: Brand.secondary }}>
              📱
            </div>
            <h2 
              className="text-2xl font-bold"
              style={{ color: Brand.primary }}
            >
              SMS Marketing and Communication
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r p-6 rounded-xl" style={{ 
              background: `linear-gradient(135deg, ${Brand.secondary}08, ${Brand.primary}05)`,
              border: `1px solid ${Brand.secondary}20`
            }}>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: Brand.secondary + '20' }}>
                  <svg className="w-3 h-3" style={{ color: Brand.primary }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: Brand.body }}
                >
                  Personal information may be used for marketing and promotional purposes, including communications by <strong>email</strong> and <strong>SMS text message</strong>. By providing a phone number and opting into SMS, you consent to receiving promotional messages, updates, exclusive offers, and order-related notifications from "CricketXpert" via text message.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r p-4 rounded-xl" style={{ 
                background: `linear-gradient(135deg, ${Brand.accent}08, ${Brand.primary}05)`,
                border: `1px solid ${Brand.accent}20`
              }}>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: Brand.accent + '20' }}>
                    <svg className="w-2.5 h-2.5" style={{ color: Brand.accent }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: Brand.body }}
                  >
                    You can opt out of marketing SMS messages at any time by following opt-out instructions or contacting customer support.
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r p-4 rounded-xl" style={{ 
                background: `linear-gradient(135deg, ${Brand.primary}08, ${Brand.secondary}05)`,
                border: `1px solid ${Brand.primary}20`
              }}>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: Brand.primary + '20' }}>
                    <svg className="w-2.5 h-2.5" style={{ color: Brand.primary }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: Brand.body }}
                  >
                    We will not share your information with third parties for their marketing purposes without your consent.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r p-6 rounded-xl" style={{ 
              background: `linear-gradient(135deg, ${Brand.secondary}08, ${Brand.accent}05)`,
              border: `1px solid ${Brand.secondary}20`
            }}>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: Brand.secondary + '20' }}>
                  <svg className="w-3 h-3" style={{ color: Brand.primary }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: Brand.body }}
                >
                  Links to other websites are provided for your convenience. We encourage you to read those sites' privacy policies, as their standards may differ from ours.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Part III: Access to Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 border-t-4" style={{ borderTopColor: Brand.primary }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: Brand.primary }}>
              3
            </div>
            <h2 
              className="text-2xl font-bold"
              style={{ color: Brand.primary }}
            >
              ACCESS TO INFORMATION
            </h2>
          </div>
          
          <div className="bg-gradient-to-r p-6 rounded-xl" style={{ 
            background: `linear-gradient(135deg, ${Brand.primary}08, ${Brand.secondary}05)`,
            border: `1px solid ${Brand.primary}20`
          }}>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: Brand.primary + '20' }}>
                <svg className="w-3 h-3" style={{ color: Brand.primary }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: Brand.body }}
              >
                CricketXpert strives to maintain accurate information. You can access your personal information and contact us about inaccuracies or to delete your information from the database by contacting us at the email address on file.
              </p>
            </div>
          </div>
        </div>

        {/* Part IV: Problem Resolution */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 border-t-4" style={{ borderTopColor: Brand.accent }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: Brand.accent }}>
              4
            </div>
            <h2 
              className="text-2xl font-bold"
              style={{ color: Brand.primary }}
            >
              PROBLEM RESOLUTION
            </h2>
          </div>
          
          <div className="bg-gradient-to-r p-6 rounded-xl" style={{ 
            background: `linear-gradient(135deg, ${Brand.accent}08, ${Brand.primary}05)`,
            border: `1px solid ${Brand.accent}20`
          }}>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: Brand.accent + '20' }}>
                <svg className="w-3 h-3" style={{ color: Brand.accent }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.759 8.071 16 9.007 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a3.996 3.996 0 01-.041-2.183l1.562-1.562C6.241 8.071 6 9.007 6 10c0 .993.241 1.929.668 2.754l1.524-1.525zm4.677-6.913a3.996 3.996 0 012.183.041l1.562-1.562C13.759 3.929 12.993 3.5 12 3.5s-1.759.429-2.415 1.05l1.562 1.562a3.996 3.996 0 011.789.027z" clipRule="evenodd" />
                </svg>
              </div>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: Brand.body }}
              >
                If you have any problems or concerns, please contact CricketXpert by email. We will resolve any disputes within <strong>one week</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Part V: Data Storage & Security */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300 border-t-4" style={{ borderTopColor: Brand.secondary }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: Brand.secondary }}>
              🔒
            </div>
            <h2 
              className="text-2xl font-bold"
              style={{ color: Brand.primary }}
            >
              DATA STORAGE & SECURITY
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r p-6 rounded-xl" style={{ 
              background: `linear-gradient(135deg, ${Brand.secondary}08, ${Brand.primary}05)`,
              border: `1px solid ${Brand.secondary}20`
            }}>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: Brand.secondary + '20' }}>
                  <svg className="w-3 h-3" style={{ color: Brand.primary }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: Brand.body }}
                >
                  We use sophisticated encryption software to protect your personal and financial data during transmission and storage. Our in-house state-of-the-art servers ensure the highest level of security for your information.
                </p>
              </div>
            </div>
            
            <div 
              className="bg-gradient-to-r p-8 rounded-2xl border-l-4 shadow-lg"
              style={{ 
                borderLeftColor: Brand.secondary,
                background: `linear-gradient(135deg, ${Brand.light}, ${Brand.secondary}10)`,
                border: `1px solid ${Brand.secondary}30`
              }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: Brand.secondary + '20' }}>
                  <svg className="w-4 h-4" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 
                  className="text-xl font-bold"
                  style={{ color: Brand.primary }}
                >
                  Contact Information
                </h3>
              </div>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: Brand.body }}
              >
                If you have any further questions about privacy or security, please contact us by sending an Email to: <a href="mailto:wenuxpc@gmail.com" className="px-2 py-1 rounded hover:shadow-md transition-all duration-300 hover:scale-105 inline-block" style={{ backgroundColor: Brand.secondary + '20', color: Brand.primary }}>wenuxpc@gmail.com</a> or calling our toll free number <strong className="px-2 py-1 rounded" style={{ backgroundColor: Brand.accent + '20', color: Brand.accent }}>1-888-CRICKET-1</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 text-center transform hover:scale-[1.02] transition-all duration-700 border-2 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ borderColor: Brand.secondary + '30', transitionDelay: '300ms' }}>
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110" style={{ backgroundColor: Brand.secondary + '20' }}>
              <svg className="w-10 h-10" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 
              className="text-4xl font-bold mb-6 bg-gradient-to-r animate-pulse"
              style={{ 
                background: `linear-gradient(135deg, ${Brand.primary}, ${Brand.secondary}, ${Brand.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite'
              }}
            >
              Questions About Our Privacy Policy?
            </h2>
            <div className="w-32 h-1 rounded-full mx-auto mb-6" style={{ background: `linear-gradient(90deg, ${Brand.secondary}, ${Brand.accent})` }}></div>
            <p 
              className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed"
              style={{ color: Brand.body }}
            >
              We're here to help clarify any questions you may have about how we handle your personal information. Our team is committed to transparency and your privacy.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
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
              <span className="text-lg">Contact Support</span>
            </button>
            <Link 
              to="/about"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg">Learn More About Us</span>
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t" style={{ borderColor: Brand.secondary + '30' }}>
            <p className="text-sm flex items-center justify-center space-x-2" style={{ color: Brand.body }}>
              <span>Last updated:</span>
              <strong className="px-2 py-1 rounded" style={{ backgroundColor: Brand.secondary + '20', color: Brand.primary }}>January 2025</strong>
              <span>|</span>
              <strong className="px-2 py-1 rounded" style={{ backgroundColor: Brand.accent + '20', color: Brand.accent }}>Version 1.0</strong>
            </p>
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

export default PrivacyPolicy;
