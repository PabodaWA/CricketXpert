import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SimpleDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      <Header />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8" style={{ color: '#072679' }}>
            🔧 Repair Management Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#072679' }}>
                Total Requests
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#42ADF5' }}>0</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#072679' }}>
                Pending
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#D88717' }}>0</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#072679' }}>
                Completed
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#36516C' }}>0</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#072679' }}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="/repair" 
                className="block bg-blue-500 text-white p-4 rounded-lg text-center hover:bg-blue-600 transition-colors"
              >
                Submit Repair Request
              </a>
              <a 
                href="/manager" 
                className="block bg-green-500 text-white p-4 rounded-lg text-center hover:bg-green-600 transition-colors"
              >
                Manager Dashboard
              </a>
              <a 
                href="/technician" 
                className="block bg-purple-500 text-white p-4 rounded-lg text-center hover:bg-purple-600 transition-colors"
              >
                Technician View
              </a>
              <a 
                href="/test" 
                className="block bg-orange-500 text-white p-4 rounded-lg text-center hover:bg-orange-600 transition-colors"
              >
                Test Page
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SimpleDashboard;
