import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
  const mainServices = [
    {
      icon: '🔧',
      title: 'Equipment Repair Services',
      description: 'Professional cricket equipment repair with expert technicians. We repair bats, pads, gloves, helmets, and all cricket gear with quality guarantee.',
      features: ['Expert Technicians', 'Quality Guarantee', 'Fast Turnaround', 'Pickup & Delivery', 'Progress Tracking', 'Repair History'],
      link: '/repair',
      color: 'from-blue-500 to-blue-600',
      workflow: ['Submit Request', 'Assessment', 'Repair Process', 'Quality Check', 'Delivery']
    },
    {
      icon: '🏏',
      title: 'Coaching Programs',
      description: 'Comprehensive cricket coaching programs for all skill levels. Learn from professional coaches with structured sessions and personalized feedback.',
      features: ['Expert Coaches', 'Structured Programs', 'Session Booking', 'Performance Tracking', 'Certificates', 'Multi-level Training'],
      link: '/programs',
      color: 'from-green-500 to-green-600',
      workflow: ['Program Selection', 'Enrollment', 'Session Booking', 'Training', 'Assessment', 'Certification']
    },
    {
      icon: '🛒',
      title: 'Cricket Products & E-commerce',
      description: 'Premium cricket equipment, gear, and accessories from top brands. Complete e-commerce platform with secure payments and delivery.',
      features: ['Premium Brands', 'Secure Payments', 'Fast Delivery', 'Order Tracking', 'Product Reviews', 'Inventory Management'],
      link: '/products',
      color: 'from-orange-500 to-orange-600',
      workflow: ['Browse Products', 'Add to Cart', 'Secure Checkout', 'Order Processing', 'Shipping', 'Delivery']
    },
    {
      icon: '🏟️',
      title: 'Ground Booking & Facilities',
      description: 'Book cricket grounds and facilities for practice sessions and matches. Multiple locations with various amenities and equipment.',
      features: ['Multiple Locations', 'Equipment Available', 'Flexible Booking', 'Facility Management', 'Slot Booking', 'Amenities'],
      link: '/ground-booking',
      color: 'from-purple-500 to-purple-600',
      workflow: ['Location Selection', 'Date & Time', 'Slot Booking', 'Payment', 'Confirmation', 'Facility Access']
    }
  ];

  const platformFeatures = [
    {
      category: 'Repair Services',
      icon: '🔧',
      items: [
        'Equipment damage assessment and diagnosis',
        'Professional repair by certified technicians',
        'Real-time repair progress tracking',
        'Quality guarantee on all repairs',
        'Pickup and delivery services',
        'Repair history and documentation',
        'Customer communication system',
        'Technician assignment and management'
      ]
    },
    {
      category: 'Coaching & Training',
      icon: '🏏',
      items: [
        'Multi-level coaching programs (Beginner, Intermediate, Advanced)',
        'Expert coaches with professional experience',
        'Structured session scheduling and booking',
        'Performance tracking and feedback system',
        'Certificate generation upon completion',
        'Session materials and resources',
        'Player enrollment management',
        'Coach dashboard and analytics'
      ]
    },
    {
      category: 'E-commerce Platform',
      icon: '🛒',
      items: [
        'Comprehensive product catalog with categories',
        'Secure payment processing and checkout',
        'Order management and tracking system',
        'Inventory management and stock control',
        'Customer reviews and ratings',
        'Delivery and shipping options',
        'Order history and reordering',
        'Product recommendations and search'
      ]
    },
    {
      category: 'Ground & Facility Management',
      icon: '🏟️',
      items: [
        'Multiple ground locations with details',
        'Flexible booking system with calendar',
        'Equipment rental and availability',
        'Facility amenities management',
        'Slot-based booking system (12 slots/day)',
        'Ground availability tracking',
        'Pricing management per slot',
        'Booking confirmation and reminders'
      ]
    }
  ];


  const stats = [
    { number: '1000+', label: 'Repairs Completed', icon: '🔧' },
    { number: '50+', label: 'Expert Coaches', icon: '🏏' },
    { number: '5000+', label: 'Happy Customers', icon: '👥' },
    { number: '24/7', label: 'Support Available', icon: '🕐' },
    { number: '100+', label: 'Products Available', icon: '🛒' },
    { number: '10+', label: 'Ground Locations', icon: '🏟️' }
  ];

  const testimonials = [
    {
      name: 'Saman Perera',
      role: 'Club Player',
      content: 'Excellent repair service! My bat was fixed perfectly and delivered on time. The progress tracking feature kept me updated throughout the process.',
      rating: 5,
      service: 'Equipment Repair'
    },
    {
      name: 'Priya Fernando',
      role: 'Student',
      content: 'The coaching program helped me improve my batting technique significantly. The session booking system is so convenient and the coach feedback is invaluable.',
      rating: 5,
      service: 'Coaching Program'
    },
    {
      name: 'Rajesh Kumar',
      role: 'Professional Player',
      content: 'Top-quality equipment and professional service. The e-commerce platform is user-friendly and delivery was fast. Highly recommended!',
      rating: 5,
      service: 'E-commerce'
    },
    {
      name: 'Michael Johnson',
      role: 'Cricket Coach',
      content: 'The coach dashboard is fantastic! Managing programs and tracking player progress has never been easier. Great platform for professional coaching.',
      rating: 5,
      service: 'Coach Dashboard'
    },
    {
      name: 'Sarah Williams',
      role: 'Ground Manager',
      content: 'The ground booking system is efficient and user-friendly. Managing multiple locations and slot bookings is seamless with this platform.',
      rating: 5,
      service: 'Ground Booking'
    },
    {
      name: 'David Chen',
      role: 'Technician',
      content: 'The technician dashboard helps me manage repair requests efficiently. The customer communication system makes it easy to provide updates.',
      rating: 5,
      service: 'Repair Management'
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F2F7' }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#F1F2F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: '#000000' }}>
              Welcome to{' '}
              <span className="bg-gradient-to-r from-[#072679] to-[#42ADF5] bg-clip-text text-transparent">
                CricketXpert
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto" style={{ color: '#36516C' }}>
              Your comprehensive cricket platform offering equipment repair, professional coaching, 
              ground booking, e-commerce, and complete cricket solutions for players of all levels.
              Experience the future of cricket services with our integrated platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/repair"
                className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ 
                  backgroundColor: '#42ADF5', 
                  color: '#F1F2F7',
                  border: '2px solid #42ADF5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2C8ED1';
                  e.target.style.borderColor = '#2C8ED1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#42ADF5';
                  e.target.style.borderColor = '#42ADF5';
                }}
              >
                Get Equipment Repaired
              </Link>
              <Link
                to="/programs"
                className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ 
                  backgroundColor: '#D88717', 
                  color: '#F1F2F7',
                  border: '2px solid #D88717'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#B8720F';
                  e.target.style.borderColor = '#B8720F';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#D88717';
                  e.target.style.borderColor = '#D88717';
                }}
              >
                Join Coaching Program
              </Link>
              <Link
                to="/products"
                className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ 
                  backgroundColor: '#072679', 
                  color: '#F1F2F7',
                  border: '2px solid #072679'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#051F5C';
                  e.target.style.borderColor = '#051F5C';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#072679';
                  e.target.style.borderColor = '#072679';
                }}
              >
                Shop Cricket Gear
              </Link>
              <Link
                to="/ground-booking"
                className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ 
                  backgroundColor: '#36516C', 
                  color: '#F1F2F7',
                  border: '2px solid #36516C'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2A3F52';
                  e.target.style.borderColor = '#2A3F52';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#36516C';
                  e.target.style.borderColor = '#36516C';
                }}
              >
                Book Ground
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16" style={{ backgroundColor: '#F1F2F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#000000' }}>Platform Statistics</h2>
            <p className="text-lg" style={{ color: '#36516C' }}>Trusted by thousands of cricket enthusiasts worldwide</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg" 
                     style={{ background: `linear-gradient(135deg, #42ADF5, #072679)` }}>
                  <span className="text-white text-2xl">{stat.icon}</span>
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#072679' }}>
                  {stat.number}
                </div>
                <div className="font-medium text-sm" style={{ color: '#36516C' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Images Section - Enhanced */}
      <section className="py-20 relative overflow-hidden" style={{ backgroundColor: '#F1F2F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000' }}>
              Our Services in Action
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#36516C' }}>
              Experience our world-class facilities and expert services through these images
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Repair Service Image */}
            <div className="group">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform group-hover:-translate-y-3 group-hover:scale-105">
                <div className="relative">
                  <img 
                    src="/src/assets/repair.jpeg" 
                    alt="Equipment Repair Service"
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <h3 className="text-2xl font-bold mb-2">Equipment Repair</h3>
                    <p className="text-sm mb-4">Professional repair services with expert technicians and quality guarantee</p>
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#42ADF5' }}></span>
                      Expert Technicians
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coaching Service Image */}
            <div className="group">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform group-hover:-translate-y-3 group-hover:scale-105">
                <div className="relative">
                  <img 
                    src="/src/assets/coaching.jpeg" 
                    alt="Coaching Programs"
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <h3 className="text-2xl font-bold mb-2">Coaching Programs</h3>
                    <p className="text-sm mb-4">Expert coaching for all skill levels with structured programs</p>
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#D88717' }}></span>
                      Professional Coaches
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shop/Products Image */}
            <div className="group">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform group-hover:-translate-y-3 group-hover:scale-105">
                <div className="relative">
                  <img 
                    src="/src/assets/shop.jpeg" 
                    alt="Cricket Products & E-commerce"
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <h3 className="text-2xl font-bold mb-2">Cricket Products</h3>
                    <p className="text-sm mb-4">Premium equipment and gear from top brands with secure delivery</p>
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#072679' }}></span>
                      Premium Brands
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ground Booking Image */}
            <div className="group">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform group-hover:-translate-y-3 group-hover:scale-105">
                <div className="relative">
                  <img 
                    src="/src/assets/ground.jpeg" 
                    alt="Ground Booking & Facilities"
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <h3 className="text-2xl font-bold mb-2">Ground Booking</h3>
                    <p className="text-sm mb-4">Book cricket grounds and facilities with flexible scheduling</p>
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#36516C' }}></span>
                      Multiple Locations
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services Section */}
      <section className="py-20" style={{ backgroundColor: '#F1F2F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000' }}>
              Our Comprehensive Services
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#36516C' }}>
              Everything you need for cricket - from equipment repair to professional coaching and premium products
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {mainServices.map((service, index) => (
              <Link
                key={index}
                to={service.link}
                className="group block"
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 h-full transform group-hover:-translate-y-2 border border-gray-100">
                  <div className="flex items-start space-x-6">
                    <div className="w-20 h-20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0 shadow-md"
                         style={{ background: `linear-gradient(135deg, #42ADF5, #072679)` }}>
                      <span className="text-white text-3xl">{service.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-3" style={{ color: '#000000' }}>
                        {service.title}
                      </h3>
                      <p className="leading-relaxed mb-4" style={{ color: '#36516C' }}>
                        {service.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm" style={{ color: '#36516C' }}>
                            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#42ADF5' }}></span>
                            {feature}
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 font-semibold transition-colors" style={{ color: '#42ADF5' }}>
                        Explore Service →
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20" style={{ backgroundColor: '#F1F2F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000' }}>
              Why Choose CricketXpert?
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#36516C' }}>
              We provide exceptional service with a commitment to quality and customer satisfaction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"
                   style={{ backgroundColor: '#42ADF5' }}>
                <span className="text-white text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>Expert Technicians</h3>
              <p style={{ color: '#36516C' }}>
                Our certified technicians have years of experience in cricket equipment repair and maintenance.
              </p>
            </div>

            <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"
                   style={{ backgroundColor: '#D88717' }}>
                <span className="text-white text-3xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>Professional Coaches</h3>
              <p style={{ color: '#36516C' }}>
                Learn from experienced coaches who have played at professional and international levels.
              </p>
            </div>

            <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"
                   style={{ backgroundColor: '#072679' }}>
                <span className="text-white text-3xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>Fast Service</h3>
              <p style={{ color: '#36516C' }}>
                Quick turnaround times for repairs and responsive customer support for all your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20" style={{ backgroundColor: '#F1F2F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000' }}>
              Platform Features
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#36516C' }}>
              Comprehensive features across all our services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {platformFeatures.map((category, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ color: '#000000' }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3 shadow-md"
                        style={{ background: `linear-gradient(135deg, #42ADF5, #072679)` }}>
                    {category.icon}
                  </span>
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.items.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: '#42ADF5' }}></span>
                      <span style={{ color: '#36516C' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className="py-20" style={{ backgroundColor: '#F1F2F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000' }}>
              What Our Users Say
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#36516C' }}>
              Don't just take our word for it - hear from our satisfied customers, coaches, and technicians
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xl">⭐</span>
                    ))}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ 
                          backgroundColor: '#E3F2FD', 
                          color: '#42ADF5' 
                        }}>
                    {testimonial.service}
                  </span>
                </div>
                <p className="mb-6 italic" style={{ color: '#36516C' }}>
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-bold" style={{ color: '#000000' }}>{testimonial.name}</div>
                  <div className="text-sm" style={{ color: '#36516C' }}>{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden" 
               style={{ background: `linear-gradient(135deg, #072679, #42ADF5)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#F1F2F7' }}>
            Ready to Experience CricketXpert?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto" style={{ color: '#E3F2FD' }}>
            Join thousands of cricket enthusiasts who trust CricketXpert for their equipment, training, and cricket needs.
            Experience the future of cricket services with our integrated platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/repair"
              className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{ 
                backgroundColor: '#F1F2F7', 
                color: '#072679',
                border: '2px solid #F1F2F7'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#E8E9ED';
                e.target.style.borderColor = '#E8E9ED';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#F1F2F7';
                e.target.style.borderColor = '#F1F2F7';
              }}
            >
              Start Your Repair
            </Link>
            <Link
              to="/programs"
              className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{ 
                backgroundColor: 'transparent', 
                color: '#F1F2F7',
                border: '2px solid #F1F2F7'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#F1F2F7';
                e.target.style.color = '#072679';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#F1F2F7';
              }}
            >
              Explore Programs
            </Link>
            <Link
              to="/products"
              className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{ 
                backgroundColor: '#D88717', 
                color: '#F1F2F7',
                border: '2px solid #D88717'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#B8720F';
                e.target.style.borderColor = '#B8720F';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#D88717';
                e.target.style.borderColor = '#D88717';
              }}
            >
              Shop Now
            </Link>
            <Link
              to="/ground-booking"
              className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{ 
                backgroundColor: 'transparent', 
                color: '#F1F2F7',
                border: '2px solid #F1F2F7'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#36516C';
                e.target.style.borderColor = '#36516C';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = '#F1F2F7';
              }}
            >
              Book Ground
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;