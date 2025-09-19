import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      <Header />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8" style={{ color: '#072679' }}>
            Privacy Policy
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-lg mb-6" style={{ color: '#36516C' }}>
              This privacy policy describes how we collect, use, and protect your personal information.
            </p>
            <p className="text-lg mb-6" style={{ color: '#36516C' }}>
              We are committed to protecting your privacy and ensuring the security of your data.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
