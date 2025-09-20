import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Brand } from '../brand';

const FAQ = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const toggleExpanded = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqData = [
    {
      question: "Can I get a discount?",
      answer: "Yes! CricketXpert offers various discounts throughout the year. We provide special pricing for bulk orders, seasonal promotions, and loyalty program members. Check our website regularly for current offers or contact our customer service team for personalized discounts."
    },
    {
      question: "What does SH mean?",
      answer: "SH stands for 'Short Handle' in cricket equipment terminology. It refers to cricket bats with shorter handles, typically preferred by younger players or those who prefer more control over their shots. Our experts can help you choose the right handle length for your playing style."
    },
    {
      question: "Why is it better to buy from local American cricket stores?",
      answer: "Buying from local American cricket stores like CricketXpert ensures faster shipping, better customer service, and authentic products. We understand local playing conditions, provide expert advice, and offer comprehensive warranty coverage. Plus, you support local businesses and the cricket community."
    },
    {
      question: "I just got my tracking number, why isn't it working?",
      answer: "Tracking numbers may take 24-48 hours to become active in the carrier's system. If your tracking number isn't working immediately, please wait a few hours and try again. If it still doesn't work after 48 hours, contact our customer service team and we'll investigate the issue for you."
    },
    {
      question: "What does 'awaiting shipment' mean?",
      answer: "'Awaiting shipment' means your order has been processed and is ready to be picked up by the shipping carrier. This status indicates that your items are packed and waiting for the carrier to collect them. You should receive your tracking information once the carrier picks up your package."
    },
    {
      question: "What does 'awaiting fulfillment' mean?",
      answer: "'Awaiting fulfillment' means your order has been received and is being prepared for shipment. Our team is currently picking, packing, and preparing your items. This process typically takes 1-2 business days before your order moves to 'awaiting shipment' status."
    },
    {
      question: "Why is my USPS.com tracking number not working?",
      answer: "USPS tracking numbers can take up to 24 hours to appear in their system after the package is scanned. If your tracking number isn't working on USPS.com, try checking our order tracking page first, or wait a few hours and try again. For urgent inquiries, contact our customer service team."
    },
    {
      question: "What coaching programs do you offer?",
      answer: "CricketXpert offers comprehensive coaching programs for all skill levels, including beginner classes, intermediate training, advanced techniques, and specialized programs for batting, bowling, and fielding. We also provide one-on-one coaching sessions and group training programs for teams and clubs."
    },
    {
      question: "How do I book a coaching session?",
      answer: "You can book coaching sessions through our website by selecting your preferred coach, time slot, and program type. We offer flexible scheduling with morning, afternoon, and evening sessions available. You can also call our coaching department directly at 1-888-CRICKET-1 to discuss your specific needs."
    },
    {
      question: "What age groups do you coach?",
      answer: "Our coaching programs cater to all age groups, from young children (ages 6+) to adults and seniors. We have specialized programs for youth development, teenage training, and adult recreational cricket. Each program is tailored to the specific needs and skill levels of different age groups."
    },
    {
      question: "How do I book a cricket ground?",
      answer: "Ground booking is simple through our online booking system. Select your preferred date, time, and ground type (practice nets, full ground, or indoor facility). You can book up to 30 days in advance, and we offer both hourly and full-day booking options with competitive rates."
    },
    {
      question: "What facilities are available for ground booking?",
      answer: "Our cricket grounds feature professional-quality pitches, practice nets, changing rooms, equipment storage, and parking facilities. We also offer indoor training facilities for year-round practice, complete with artificial turf and climate control for optimal playing conditions."
    },
    {
      question: "Can I cancel or reschedule my ground booking?",
      answer: "Yes, you can cancel or reschedule your ground booking up to 24 hours before your scheduled time without any penalty. Cancellations made within 24 hours may be subject to a cancellation fee. You can manage your bookings through your account dashboard or contact our booking team."
    },
    {
      question: "What types of cricket equipment do you repair?",
      answer: "We repair all types of cricket equipment including bats (handle repairs, blade restoration, grip replacement), balls (re-stitching, leather conditioning), protective gear (helmet repairs, pad adjustments), and accessories (glove repairs, bag fixes). Our skilled technicians can restore equipment to professional standards."
    },
    {
      question: "How long does equipment repair take?",
      answer: "Repair times vary depending on the type and extent of damage. Simple repairs like grip replacement or minor stitching can be completed within 24-48 hours. More complex repairs like bat handle replacement or major leather work may take 3-7 business days. We provide detailed time estimates when you submit your repair request."
    },
    {
      question: "Do you offer warranty on equipment repairs?",
      answer: "Yes, we provide a comprehensive warranty on all our repair work. Standard repairs come with a 30-day warranty, while major repairs and restorations include a 90-day warranty. We stand behind our workmanship and will re-repair any issues covered under warranty at no additional cost."
    }
  ];

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
      
      {/* Enhanced Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: Brand.secondary }}></div>
      <div className="absolute top-40 right-20 w-16 h-16 rounded-full opacity-10 animate-bounce" style={{ backgroundColor: Brand.accent }}></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: Brand.primary }}></div>
      <div className="absolute top-60 left-1/4 w-8 h-8 rounded-full opacity-10 animate-ping" style={{ backgroundColor: Brand.secondary }}></div>
      <div className="absolute bottom-60 right-1/4 w-10 h-10 rounded-full opacity-10 animate-bounce" style={{ backgroundColor: Brand.accent }}></div>
      
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Enhanced Header Section */}
        <div className={`bg-white rounded-3xl shadow-2xl p-10 mb-8 transform transition-all duration-700 border-l-6 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ borderLeftColor: Brand.secondary }}>
          <div className="border-b-2 pb-8 mb-8" style={{ borderColor: Brand.secondary }}>
            <nav className="text-sm mb-6 flex items-center">
              <span className="px-6 py-3 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300" style={{ backgroundColor: Brand.secondary + '20', color: Brand.primary }}>
                🏠 Home / FAQ
              </span>
            </nav>
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110" style={{ backgroundColor: Brand.secondary + '20' }}>
                <svg className="w-10 h-10" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 
                  className="text-6xl font-bold bg-gradient-to-r animate-pulse"
                  style={{ 
                    background: `linear-gradient(135deg, ${Brand.primary}, ${Brand.secondary}, ${Brand.accent})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    backgroundSize: '200% 200%',
                    animation: 'gradient 3s ease infinite'
                  }}
                >
                  FAQ Center
                </h1>
                <div className="w-32 h-1.5 rounded-full mt-3" style={{ background: `linear-gradient(90deg, ${Brand.secondary}, ${Brand.accent})` }}></div>
              </div>
            </div>
            <p 
              className="text-2xl font-medium flex items-center space-x-3"
              style={{ color: Brand.body }}
            >
              <span>Find answers to common questions</span>
              <span className="text-3xl animate-bounce">❓</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-r p-10 rounded-3xl mb-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2" style={{ 
            background: `linear-gradient(135deg, ${Brand.secondary}15, ${Brand.primary}10, ${Brand.accent}05)`,
            borderColor: Brand.secondary + '30'
          }}>
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg" style={{ backgroundColor: Brand.secondary + '30' }}>
                <svg className="w-6 h-6" style={{ color: Brand.primary }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p 
                  className="text-xl leading-relaxed mb-4"
                  style={{ color: Brand.body }}
                >
                  Browse through our comprehensive FAQ section to find quick answers about our cricket services, equipment, shipping, and more. Our knowledge base is regularly updated to provide you with the most current information.
                </p>
                <div className="flex items-center space-x-4 text-sm" style={{ color: Brand.body }}>
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: Brand.secondary }}></span>
                    <span>16 Common Questions</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: Brand.accent }}></span>
                    <span>All Services Covered</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: Brand.primary }}></span>
                    <span>Expert Answers</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Enhanced FAQ Section */}
        <div className={`bg-white rounded-3xl shadow-2xl p-10 mb-8 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {faqData.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-r rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer border-2"
                style={{ 
                  background: `linear-gradient(135deg, ${Brand.secondary}08, ${Brand.primary}05)`,
                  borderColor: Brand.secondary + '20'
                }}
                onClick={() => toggleExpanded(index)}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 
                      className="text-xl font-bold leading-tight pr-4"
                      style={{ color: Brand.primary }}
                    >
                      {item.question}
                    </h3>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg flex-shrink-0"
                      style={{ 
                        backgroundColor: expandedItems[index] ? Brand.accent : Brand.secondary + '20',
                        color: expandedItems[index] ? 'white' : Brand.primary
                      }}
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform duration-300 ${expandedItems[index] ? 'rotate-45' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-500 ${expandedItems[index] ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="pt-6 border-t-2" style={{ borderColor: Brand.secondary + '30' }}>
                      <p 
                        className="text-lg leading-relaxed"
                        style={{ color: Brand.body }}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Call to Action Section */}
        <div className={`bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-12 text-center transform hover:scale-[1.02] transition-all duration-700 border-2 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ borderColor: Brand.secondary + '30', transitionDelay: '400ms' }}>
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110" style={{ backgroundColor: Brand.secondary + '20' }}>
              <svg className="w-12 h-12" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 
              className="text-5xl font-bold mb-8 bg-gradient-to-r animate-pulse"
              style={{ 
                background: `linear-gradient(135deg, ${Brand.primary}, ${Brand.secondary}, ${Brand.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite'
              }}
            >
              Still Have Questions?
            </h2>
            <div className="w-40 h-1.5 rounded-full mx-auto mb-8" style={{ background: `linear-gradient(90deg, ${Brand.secondary}, ${Brand.accent})` }}></div>
            <p 
              className="text-xl mb-10 max-w-3xl mx-auto leading-relaxed"
              style={{ color: Brand.body }}
            >
              Can't find the answer you're looking for? Our friendly support team is here to help you with any questions about our cricket services, equipment, or orders. We're committed to providing exceptional customer service.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-10">
            <button 
              className="px-12 py-6 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-4 group"
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
              <svg className="w-7 h-7 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xl">Contact Support</span>
            </button>
            <Link 
              to="/about"
              className="px-12 py-6 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-4 group"
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
              <svg className="w-7 h-7 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xl">Learn More About Us</span>
            </Link>
          </div>
          
          <div className="pt-8 border-t-2" style={{ borderColor: Brand.secondary + '30' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: Brand.secondary + '20' }}>
                  <svg className="w-6 h-6" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: Brand.body }}>Phone Support</p>
                <p className="text-lg font-bold" style={{ color: Brand.primary }}>1-888-CRICKET-1</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: Brand.accent + '20' }}>
                  <svg className="w-6 h-6" style={{ color: Brand.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: Brand.body }}>Email Support</p>
                <p className="text-lg font-bold" style={{ color: Brand.primary }}>wenuxpc@gmail.com</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: Brand.primary + '20' }}>
                  <svg className="w-6 h-6" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: Brand.body }}>Response Time</p>
                <p className="text-lg font-bold" style={{ color: Brand.primary }}>Within 24 Hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Custom CSS for animations */}
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
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
      <Footer />
    </div>
  );
};

export default FAQ;