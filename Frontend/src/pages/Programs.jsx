import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('http://localhost:5000/api/programs');
      
      if (response.data.success) {
        setPrograms(response.data.data.docs || []);
      } else {
        setError('Failed to load programs');
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err.response?.data?.message || 'Failed to load programs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading programs...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Programs</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchPrograms}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Page Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Coaching Programs</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our comprehensive coaching programs designed to help you improve your cricket skills
            </p>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {programs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏏</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Programs Available</h3>
            <p className="text-gray-600">Check back later for new coaching programs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div key={program._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                {/* Program Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-white text-6xl">🏏</div>
                </div>
                
                <div className="p-6">
                  {/* Program Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {program.title}
                  </h3>
                  
                  {/* Coach Name */}
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-gray-600 text-sm font-medium">
                        {program.coach?.userId?.firstName?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coach</p>
                      <p className="font-medium text-gray-900">
                        {program.coach?.userId?.firstName} {program.coach?.userId?.lastName}
                      </p>
                    </div>
                  </div>
                  
                  {/* Program Details */}
                  <div className="space-y-2 mb-4">
                    {program.duration && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">⏱️</span>
                        <span>{program.duration} weeks</span>
                      </div>
                    )}
                    {program.fee && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">💰</span>
                        <span className="font-semibold text-green-600">${program.fee}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                    {program.description || 'No description available for this program.'}
                  </p>
                  
                  {/* See More Button */}
                  <Link
                    to={`/programs/${program._id}`}
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    See More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
