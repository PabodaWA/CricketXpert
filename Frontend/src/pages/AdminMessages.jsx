import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Brand } from '../brand';

const AdminMessages = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 (555) 123-4567',
      message: 'Hi, I need help with my cricket bat repair. The handle is loose and needs to be fixed. Can you please let me know the cost and timeline?',
      timestamp: '2024-01-15 10:30 AM',
      status: 'new',
      priority: 'medium'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 (555) 987-6543',
      message: 'I\'m interested in your coaching programs for my 12-year-old son. What programs do you offer and what are the schedules?',
      timestamp: '2024-01-15 09:15 AM',
      status: 'in-progress',
      priority: 'high'
    },
    {
      id: 3,
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      phone: '+1 (555) 456-7890',
      message: 'I want to book a cricket ground for our team practice this weekend. What are the available time slots and rates?',
      timestamp: '2024-01-14 4:45 PM',
      status: 'completed',
      priority: 'low'
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+1 (555) 321-0987',
      message: 'My cricket helmet got damaged during a match. Can you repair it or do I need to buy a new one? Please advise on the best option.',
      timestamp: '2024-01-14 2:20 PM',
      status: 'new',
      priority: 'high'
    },
    {
      id: 5,
      name: 'David Brown',
      email: 'david.brown@email.com',
      phone: '+1 (555) 654-3210',
      message: 'I\'m looking for a complete cricket kit for my daughter who is starting to play. What packages do you have available?',
      timestamp: '2024-01-13 11:10 AM',
      status: 'in-progress',
      priority: 'medium'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Load messages from localStorage and merge with sample data
    const savedMessages = JSON.parse(localStorage.getItem('adminMessages') || '[]');
    
    // Sample message IDs to avoid duplicates
    const sampleIds = [1, 2, 3, 4, 5];
    const newMessages = savedMessages.filter(msg => !sampleIds.includes(msg.id));
    
    if (newMessages.length > 0) {
      setMessages(prev => [...newMessages, ...prev]);
    }
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return Brand.primary;
      case 'in-progress': return Brand.accent;
      case 'completed': return '#10B981';
      default: return Brand.body;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return Brand.accent;
      case 'low': return '#10B981';
      default: return Brand.body;
    }
  };

  const filteredMessages = messages;

  const updateMessageStatus = (id, newStatus) => {
    setMessages(prev => {
      const updatedMessages = prev.map(msg => 
        msg.id === id ? { ...msg, status: newStatus } : msg
      );
      
      // Save updated messages to localStorage
      const savedMessages = JSON.parse(localStorage.getItem('adminMessages') || '[]');
      const updatedSavedMessages = savedMessages.map(msg => 
        msg.id === id ? { ...msg, status: newStatus } : msg
      );
      localStorage.setItem('adminMessages', JSON.stringify(updatedSavedMessages));
      
      return updatedMessages;
    });
  };

  const handleViewDetails = (message) => {
    setSelectedMessage(message);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedMessage(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: Brand.light }}>
      <Header />
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${Brand.secondary} 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, ${Brand.primary} 2px, transparent 2px),
                           linear-gradient(45deg, transparent 40%, ${Brand.accent}20 50%, transparent 60%)`,
          backgroundSize: '50px 50px, 50px 50px, 100px 100px'
        }}></div>
      </div>
      
      
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Header Section */}
        <div className={`bg-white rounded-3xl shadow-2xl p-10 mb-8 transform transition-all duration-700 border-l-6 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ borderLeftColor: Brand.primary }}>
          <div className="border-b-2 pb-8 mb-8" style={{ borderColor: Brand.primary }}>
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110" style={{ backgroundColor: Brand.primary + '20' }}>
                <svg className="w-10 h-10" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 
                  className="text-6xl font-bold"
                  style={{ color: Brand.primary }}
                >
                  Customer Messages
                </h1>
                <div className="w-32 h-1.5 rounded-full mt-3" style={{ background: `linear-gradient(90deg, ${Brand.primary}, ${Brand.secondary})` }}></div>
              </div>
            </div>
            <p 
              className="text-xl font-medium flex items-center space-x-2"
              style={{ color: Brand.body }}
            >
              <span>View and manage customer messages</span>
              <span className="text-2xl">📧</span>
            </p>
          </div>
        </div>


        {/* Messages List */}
        <div className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
          <div className="space-y-6">
            {filteredMessages.map((message, index) => (
              <div 
                key={message.id}
                className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01] border-l-4"
                style={{ 
                  borderLeftColor: getStatusColor(message.status),
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Message Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: Brand.primary + '20' }}>
                          <span className="text-lg font-bold" style={{ color: Brand.primary }}>
                            {message.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: Brand.primary }}>{message.name}</h3>
                          <p className="text-sm" style={{ color: Brand.body }}>{message.timestamp}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5" style={{ color: Brand.secondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span style={{ color: Brand.body }}>{message.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5" style={{ color: Brand.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span style={{ color: Brand.body }}>{message.phone}</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r p-6 rounded-2xl shadow-md" style={{ 
                      background: `linear-gradient(135deg, ${Brand.primary}08, ${Brand.secondary}05)`,
                      border: `1px solid ${Brand.primary}20`
                    }}>
                      <p className="text-lg leading-relaxed" style={{ color: Brand.body }}>
                        {message.message}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-3 lg:w-48">
                    <button
                      onClick={() => handleViewDetails(message)}
                      className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                      style={{ 
                        backgroundColor: Brand.primary + '20',
                        color: Brand.primary
                      }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        console.log('Delete button clicked for message:', message.id, message.name);
                        if (window.confirm('Are you sure you want to delete this message?')) {
                          console.log('Deleting message with ID:', message.id);
                          setMessages(prev => {
                            const filtered = prev.filter(msg => msg.id !== message.id);
                            console.log('Messages after deletion:', filtered.length);
                            return filtered;
                          });
                          // Also remove from localStorage
                          const savedMessages = JSON.parse(localStorage.getItem('adminMessages') || '[]');
                          const updatedMessages = savedMessages.filter(msg => msg.id !== message.id);
                          localStorage.setItem('adminMessages', JSON.stringify(updatedMessages));
                          console.log('Updated localStorage messages:', updatedMessages.length);
                        }
                      }}
                      className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                      style={{ 
                        backgroundColor: '#EF444420',
                        color: '#EF4444'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMessages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: Brand.primary + '20' }}>
                <svg className="w-12 h-12" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: Brand.primary }}>No Messages Found</h3>
              <p style={{ color: Brand.body }}>No customer messages available at this time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Details Modal */}
      {showDetails && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h2 className="text-2xl font-semibold" style={{ color: Brand.primary }}>Message Details</h2>
                <button
                  onClick={closeDetails}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" style={{ color: Brand.body }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Customer Information */}
              <div className="p-4 mb-4" style={{ 
                backgroundColor: Brand.primary + '05',
                border: `1px solid ${Brand.primary}15`
              }}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: Brand.primary + '15' }}>
                    <span className="text-sm font-semibold" style={{ color: Brand.primary }}>
                      {selectedMessage.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: Brand.primary }}>{selectedMessage.name}</h3>
                    <p className="text-xs" style={{ color: Brand.body }}>{selectedMessage.timestamp}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" style={{ color: Brand.secondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm" style={{ color: Brand.body }}>{selectedMessage.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" style={{ color: Brand.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm" style={{ color: Brand.body }}>{selectedMessage.phone}</span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="p-4 mb-4" style={{ 
                backgroundColor: Brand.secondary + '05',
                border: `1px solid ${Brand.secondary}15`
              }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: Brand.primary }}>Message Content</h4>
                <p className="text-sm leading-relaxed" style={{ color: Brand.body }}>
                  {selectedMessage.message}
                </p>
              </div>

              {/* Message Status */}
              <div className="p-4 mb-4" style={{ 
                backgroundColor: Brand.accent + '05',
                border: `1px solid ${Brand.accent}15`
              }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: Brand.primary }}>Message Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: Brand.body }}>Status</p>
                    <span 
                      className="px-2 py-1 text-xs font-medium"
                      style={{ 
                        backgroundColor: getStatusColor(selectedMessage.status) + '15',
                        color: getStatusColor(selectedMessage.status)
                      }}
                    >
                      {selectedMessage.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: Brand.body }}>Priority</p>
                    <span 
                      className="px-2 py-1 text-xs font-medium"
                      style={{ 
                        backgroundColor: getPriorityColor(selectedMessage.priority) + '15',
                        color: getPriorityColor(selectedMessage.priority)
                      }}
                    >
                      {selectedMessage.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={closeDetails}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: Brand.primary }}
                >
                  Close
                </button>
                <button
                  className="flex-1 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: Brand.secondary }}
                >
                  Reply to Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
      <Footer />
    </div>
  );
};

export default AdminMessages;
