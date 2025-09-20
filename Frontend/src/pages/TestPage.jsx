import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold mb-4" style={{ color: '#072679' }}>
          🎉 Test Page Working!
        </h1>
        <p className="text-lg" style={{ color: '#36516C' }}>
          If you can see this, the React app is working correctly.
        </p>
        <div className="mt-6">
          <a 
            href="/" 
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
