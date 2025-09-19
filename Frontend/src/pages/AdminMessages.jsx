import React from 'react';

const AdminMessages = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8" style={{ color: '#072679' }}>
            Admin Messages
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-lg mb-6" style={{ color: '#36516C' }}>
              This is the admin messages page where administrators can view and manage messages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
