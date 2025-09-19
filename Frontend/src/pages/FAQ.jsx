import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FAQ = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      <Header />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8" style={{ color: '#072679' }}>
            Frequently Asked Questions
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#072679' }}>
                  How long does a repair take?
                </h3>
                <p style={{ color: '#36516C' }}>
                  Repair times vary depending on the type and extent of damage. 
                  We will provide an estimated timeline when you submit your request.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#072679' }}>
                  What types of equipment do you repair?
                </h3>
                <p style={{ color: '#36516C' }}>
                  We repair a wide variety of equipment including electronics, 
                  machinery, and other technical devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
