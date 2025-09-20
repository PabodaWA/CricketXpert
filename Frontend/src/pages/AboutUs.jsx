import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import aboutgearImage from '../assets/aboutgear.jpeg';
import aboutequipmentImage from '../assets/aboutequipment.jpeg';
import aboutshopImage from '../assets/aboutshop.jpeg';
import aboutcusImage from '../assets/aboutcus.jpeg';
import aboutrepairImage from '../assets/aboutrepair.jpeg';
import aboutgroudImage from '../assets/aboutgroud.jpeg';
import aboutprogramImage from '../assets/aboutprogram.jpeg';

const AboutUs = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  
  const testimonials = [
    {
      id: 1,
      name: "Harsha Kamma",
      initials: "HK",
      text: "Good prices and prompt response on WhatsApp. They have many options to ship from."
    },
    {
      id: 2,
      name: "Muhammed Beg",
      initials: "MB",
      text: "Ordered a Kookaburra bat and pair of gloves for my 11 years old son. Received the items on time as promised. I was hesitant first before ordering, what if bat is not as expected. However bat is what I expected - size, weight. And their customers service also great, had a question after delivery and I had on time satisfactory response from them. I have already recommended other parents in our club here in Kansas."
    },
    {
      id: 3,
      name: "Frieth Critical",
      initials: "FC",
      text: "Excellent customer service and messaging. Excellent communication and so good high quality products."
    },
    {
      id: 4,
      name: "John Smith",
      initials: "JS",
      text: "Amazing quality cricket equipment and fast delivery. The customer service team was very helpful in choosing the right bat for my needs."
    },
    {
      id: 5,
      name: "Aisha Rahman",
      initials: "AR",
      text: "Great experience shopping here. The equipment arrived in perfect condition and the prices are very competitive. Highly recommended!"
    },
    {
      id: 6,
      name: "David Lee",
      initials: "DL",
      text: "Outstanding service and product quality. The team helped me find the perfect cricket gear for my son's tournament. Will definitely shop again!"
    },
    {
      id: 7,
      name: "Sarah Patel",
      initials: "SP",
      text: "Fast shipping and excellent customer support. The cricket bat I ordered exceeded my expectations. Thank you for the great service!"
    }
  ];

  const scrollLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const scrollRight = () => {
    if (currentIndex < testimonials.length - 3) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Loop back to start
    }
  };

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        if (prevIndex < testimonials.length - 3) {
          return prevIndex + 1;
        } else {
          return 0; // Loop back to start
        }
      });
    }, 1000); // Auto-scroll every 1 second

    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#F1F2F7' }}>
      <Header />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 border border-gray-300 rounded-full"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-gray-300 rounded-full"></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 border border-gray-300 rounded-full"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 border border-gray-300 rounded-full"></div>
      </div>
      {/* Hero Section - About Us */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="relative">
                <h1 className="text-5xl lg:text-6xl font-bold mb-4" style={{ color: '#000000' }}>
                  About Us
                </h1>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
              </div>
              <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                Welcome to Cricket Store Online, where our journey is fueled by a deep love for cricket that's been with us since childhood. In 2004-2005, Dipesh and Amar started bringing cricket gear from India for their friends to ensure they had the best equipment possible. Seeing the need for better cricketing infrastructure in the USA, they set up the Cricmax facility to address the diverse needs of cricketers. As passionate cricket fans, they knew the difference quality gear could make in the game. This journey ultimately led them to acquire Cricket Store Online, seizing the opportunity to scale and meet the growing demand for premium quality cricket equipment. From humble beginnings of delivering products door to door, Cricket Store Online has evolved into the USA's largest cricket gear supplier. Inspired by our journey, we are committed to making Cricket Store Online a destination where we provide innovative solutions and elevate the cricketing experience for all.
              </p>
            </div>
            
            {/* Cricket Equipment Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={aboutgearImage} 
                  alt="Cricket Equipment - Premium Quality Gear"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Commitment Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="p-10 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden" style={{ backgroundColor: '#42ADF5' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-6" style={{ color: '#F1F2F7' }}>Our Mission</h2>
                <p className="leading-relaxed text-lg" style={{ color: '#F1F2F7' }}>
                  Cricket Store Online aims to make cricket accessible to everyone, regardless of background or skill, believing in its ability to bring people together. We are committed to sharing the joy of cricket and guiding customers through the world of cricket gear with expert advice and top-notch equipment.
                </p>
              </div>
            </div>
            
            {/* Commitment to Quality */}
            <div className="p-10 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden" style={{ backgroundColor: '#072679' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-6" style={{ color: '#F1F2F7' }}>Commitment to Quality</h2>
                <p className="leading-relaxed text-lg" style={{ color: '#F1F2F7' }}>
                  Quality is a solemn promise, ensuring every product meets high standards of performance and durability. We visit manufacturers multiple times yearly and build strong relationships with suppliers to continually improve and innovate. No stone is unturned in our pursuit of excellence, from glove stitching to ball leather, assuring customers they are investing in the best of the best.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Range Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Cricket Equipment Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300"></div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={aboutequipmentImage} 
                  alt="Cricket Equipment Collection - Premium Brands"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Text Content */}
            <div className="space-y-8">
              <div className="relative">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#000000' }}>
                  Our Product Range And Promise To Customers
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-transparent"></div>
              </div>
              <div className="space-y-6">
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  Discover Cricket Store Online's vast array of cricket gear, carefully selected to meet the needs of players at every level. From bats and balls to protective gear and accessories, our diverse range ensures that you'll find the perfect equipment to elevate your game.
                </p>
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  We pride ourselves on offering the latest, officially sourced cricket equipment, partnering with leading brands to provide our customers with the most advanced gear available. Whether you're a seasoned professional or just starting, Cricket Store Online has everything you need to perform at your best on the field.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="relative">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#000000' }}>
                  Begin Your Cricketing Journey With Cricket Store Online
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-transparent"></div>
              </div>
              <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                At Cricket Store Online, we're more than just a store - we're your dedicated cricketing partner, ready to support you every step of the way. Explore our extensive range of top-quality gear, meticulously selected to meet your needs and elevate your performance on the field. With expert guidance, top-notch customer service, and a commitment to excellence, Cricket Store Online is the ultimate destination for all your cricketing needs. Join us today and experience the difference as we help you take your game to new heights.
              </p>
            </div>
            
            {/* Cricket Equipment Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={aboutshopImage} 
                  alt="Complete Cricket Kit - Everything You Need"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Experience Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Cricket Equipment Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300"></div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={aboutcusImage} 
                  alt="Customer Support - Always Here to Help"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Text Content */}
            <div className="space-y-8">
              <div className="relative">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#000000' }}>
                  Our Customer Experience
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-transparent"></div>
              </div>
              <div className="space-y-6">
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  We prioritize exceptional customer experiences, evidenced by our online reviews. Our dedicated CSO Team and thousands of satisfied customers, including individuals, coaches, and players from cricket academies, have established a loyal community that trusts us for their cricketing needs.
                </p>
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  We offer transparency through expert video reviews, accurate measurements, and detailed product photos to help customers make informed decisions. We provide personalized assistance through phone calls, WhatsApp, or in-person interactions, going above and beyond for our customers, including post-delivery follow-ups.
                </p>
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  We ensure every purchase meets or exceeds expectations, solidifying our reputation for exceptional customer service and support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Repair Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="relative">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#000000' }}>
                  Professional Repair Services
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-transparent"></div>
              </div>
              <div className="space-y-6">
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  Our skilled technicians provide comprehensive cricket equipment repair services. From bat re-gripping and handle repairs to helmet maintenance and protective gear restoration, we ensure your equipment performs at its peak.
                </p>
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  We use only the finest materials and techniques to restore your cricket gear to professional standards. Whether it's a cracked bat handle or worn-out gloves, our expert repair services will extend the life of your equipment and enhance your performance on the field.
                </p>
              </div>
            </div>
            
            {/* Repair Services Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={aboutrepairImage} 
                  alt="Professional Cricket Equipment Repair Services"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ground Booking Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Ground Booking Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300"></div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={aboutgroudImage} 
                  alt="Premium Cricket Grounds for Booking"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Text Content */}
            <div className="space-y-8">
              <div className="relative">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#000000' }}>
                  Premium Ground Booking
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-transparent"></div>
              </div>
              <div className="space-y-6">
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  Book our premium cricket grounds for practice sessions, matches, and tournaments. Our facilities feature professional-grade pitches, modern amenities, and well-maintained playing surfaces that meet international standards.
                </p>
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  Whether you're organizing a local tournament, team practice, or individual training session, our grounds provide the perfect environment for cricket enthusiasts of all levels. Experience the difference that quality facilities make in your game.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coaching Program Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="relative">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#000000' }}>
                  Expert Coaching Programs
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 to-transparent"></div>
              </div>
              <div className="space-y-6">
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  Learn from experienced cricket coaches who have played at professional levels. Our comprehensive coaching programs cover batting techniques, bowling variations, fielding skills, and strategic game understanding for players of all ages and skill levels.
                </p>
                <p className="text-xl leading-relaxed" style={{ color: '#36516C' }}>
                  From beginners taking their first steps in cricket to advanced players looking to refine their techniques, our personalized coaching approach ensures every student receives the attention and guidance they need to excel in the sport.
                </p>
              </div>
            </div>
            
            {/* Coaching Program Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={aboutprogramImage} 
                  alt="Expert Cricket Coaching Programs"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10" style={{ backgroundColor: '#F1F2F7' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000' }}>Our Achievements</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 gap-8 md:gap-16">
            {/* Statistic 1 */}
            <div className="text-center group">
              <div className="relative">
                <div className="text-5xl md:text-6xl font-bold mb-4 transform group-hover:scale-110 transition-transform duration-300" style={{ color: '#36516C' }}>
                  20+
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity duration-300"></div>
              </div>
              <div className="text-xl font-semibold" style={{ color: '#36516C' }}>
                Years of Experience
              </div>
            </div>

            {/* Statistic 2 */}
            <div className="text-center group">
              <div className="relative">
                <div className="text-5xl md:text-6xl font-bold mb-4 transform group-hover:scale-110 transition-transform duration-300" style={{ color: '#36516C' }}>
                  1000+
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-600 opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity duration-300"></div>
              </div>
              <div className="text-xl font-semibold" style={{ color: '#36516C' }}>
                Happy Customers
              </div>
            </div>

            {/* Statistic 3 */}
            <div className="text-center group">
              <div className="relative">
                <div className="text-5xl md:text-6xl font-bold mb-4 transform group-hover:scale-110 transition-transform duration-300" style={{ color: '#36516C' }}>
                  50+
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity duration-300"></div>
              </div>
              <div className="text-xl font-semibold" style={{ color: '#36516C' }}>
                Cricket Grounds
              </div>
            </div>

            {/* Statistic 4 */}
            <div className="text-center group">
              <div className="relative">
                <div className="text-5xl md:text-6xl font-bold mb-4 transform group-hover:scale-110 transition-transform duration-300" style={{ color: '#36516C' }}>
                  200+
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity duration-300"></div>
              </div>
              <div className="text-xl font-semibold" style={{ color: '#36516C' }}>
                Equipment Repairs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: '#072679' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-32 right-1/3 w-14 h-14 border-2 border-white rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Happy You! Happy We!</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"></div>
          </div>
          
          {/* Carousel Container */}
          <div className="relative">
            {/* Left Arrow Button */}
            <button
              onClick={scrollLeft}
              disabled={currentIndex === 0}
              className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                currentIndex === 0 
                  ? 'bg-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-white hover:bg-gray-100 cursor-pointer hover:scale-110 shadow-xl'
              }`}
              style={{ marginLeft: '-28px' }}
            >
              <svg className="w-6 h-6" style={{ color: currentIndex === 0 ? '#9CA3AF' : '#072679' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Arrow Button */}
            <button
              onClick={scrollRight}
              disabled={currentIndex >= testimonials.length - 3}
              className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                currentIndex >= testimonials.length - 3 
                  ? 'bg-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-white hover:bg-gray-100 cursor-pointer hover:scale-110 shadow-xl'
              }`}
              style={{ marginRight: '-28px' }}
            >
              <svg className="w-6 h-6" style={{ color: currentIndex >= testimonials.length - 3 ? '#9CA3AF' : '#072679' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Testimonials Container */}
            <div className="overflow-hidden mx-16">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${currentIndex * (340 + 32)}px)`,
                  width: `${testimonials.length * (340 + 32)}px`
                }}
              >
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={testimonial.id}
                    className="bg-white p-8 rounded-2xl shadow-2xl flex-shrink-0 mr-8 transform hover:scale-105 transition-all duration-300 border-l-4" 
                    style={{ 
                      width: '340px', 
                      minHeight: '240px',
                      borderLeftColor: index % 3 === 0 ? '#42ADF5' : index % 3 === 1 ? '#072679' : '#D88717'
                    }}
                  >
                    {/* Quote Icon */}
                    <div className="absolute top-4 right-4 opacity-20">
                      <svg className="w-8 h-8" style={{ color: '#36516C' }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                      </svg>
                    </div>
                    
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mr-4 shadow-lg" 
                           style={{ 
                             background: `linear-gradient(135deg, ${index % 3 === 0 ? '#42ADF5' : index % 3 === 1 ? '#072679' : '#D88717'}, ${index % 3 === 0 ? '#2C8ED1' : index % 3 === 1 ? '#051A4A' : '#B86A0F'})`
                           }}>
                        <span className="text-white font-bold text-lg">{testimonial.initials}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg" style={{ color: '#000000' }}>{testimonial.name}</h4>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed relative z-10" style={{ color: '#36516C' }}>
                      "{testimonial.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Enhanced Scroll Indicators */}
            <div className="flex justify-center mt-8 space-x-3">
              {Array.from({ length: Math.ceil(testimonials.length / 3) }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * 3)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    Math.floor(currentIndex / 3) === index 
                      ? 'bg-white scale-125 shadow-lg' 
                      : 'bg-white opacity-40 hover:opacity-70'
                  }`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <Footer />
    </div>
  );
};

export default AboutUs;
