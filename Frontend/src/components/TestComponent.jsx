import React from 'react';
import { Link } from 'react-router-dom';

const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">🏏 CricketXpert</h1>
        <p className="text-xl text-gray-600 mb-8">Cricket Equipment Repair System</p>
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">System Status</h2>
          <div className="space-y-3 text-left">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-600">Frontend Server: Running</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-600">React App: Loaded</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-600">Backend: Connected</span>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <Link to="/repair" className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
              Go to Repair Request Form
            </Link>
            <Link to="/manager" className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition">
              Service Manager Dashboard
            </Link>
            <Link to="/technician" className="block w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition">
              Technician Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
