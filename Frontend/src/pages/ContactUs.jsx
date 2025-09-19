import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      <Header />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8" style={{ color: '#072679' }}>
            Contact Us
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-lg mb-6" style={{ color: '#36516C' }}>
              Get in touch with us for any questions or concerns about our repair services.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#072679' }}>
                  Phone
                </h3>
                <p style={{ color: '#36516C' }}>+1 (555) 123-4567</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#072679' }}>
                  Email
                </h3>
                <p style={{ color: '#36516C' }}>info@repairservice.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs;
