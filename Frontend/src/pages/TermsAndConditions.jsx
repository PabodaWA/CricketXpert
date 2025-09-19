import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      <Header />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8" style={{ color: '#072679' }}>
            Terms and Conditions
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-lg mb-6" style={{ color: '#36516C' }}>
              Please read these terms and conditions carefully before using our service.
            </p>
            <p className="text-lg mb-6" style={{ color: '#36516C' }}>
              By using our service, you agree to be bound by these terms and conditions.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
