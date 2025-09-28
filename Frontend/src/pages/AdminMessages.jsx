import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
            <p className="text-gray-600 mt-1">View and manage customer messages and inquiries</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Total Messages:</span>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          </div>
        </div>
      </div>


      {/* Messages List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="space-y-4">
            {filteredMessages.map((message, index) => (
              <div 
                key={message.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  {/* Message Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {message.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{message.name}</h3>
                        <p className="text-sm text-gray-500">{message.timestamp}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-600">{message.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm text-gray-600">{message.phone}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(message)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this message?')) {
                          setMessages(prev => prev.filter(msg => msg.id !== message.id));
                          const savedMessages = JSON.parse(localStorage.getItem('adminMessages') || '[]');
                          const updatedMessages = savedMessages.filter(msg => msg.id !== message.id);
                          localStorage.setItem('adminMessages', JSON.stringify(updatedMessages));
                        }
                      }}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
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
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Found</h3>
              <p className="text-gray-500">No customer messages available at this time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Details Modal */}
      {showDetails && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h2 className="text-xl font-semibold text-gray-900">Message Details</h2>
                <button
                  onClick={closeDetails}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 p-4 mb-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {selectedMessage.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMessage.name}</h3>
                    <p className="text-sm text-gray-500">{selectedMessage.timestamp}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{selectedMessage.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-600">{selectedMessage.phone}</span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-blue-50 p-4 mb-4 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-gray-900">Message Content</h4>
                <p className="text-sm leading-relaxed text-gray-700">
                  {selectedMessage.message}
                </p>
              </div>

              {/* Message Status */}
              <div className="bg-green-50 p-4 mb-4 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-gray-900">Message Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1 text-gray-600">Status</p>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {selectedMessage.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1 text-gray-600">Priority</p>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      {selectedMessage.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={closeDetails}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
                <button
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  Reply to Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
