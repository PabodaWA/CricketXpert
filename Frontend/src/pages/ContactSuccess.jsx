import React from 'react';

const ContactSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8" style={{ color: '#072679' }}>
            Message Sent Successfully
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg mb-6" style={{ color: '#36516C' }}>
              Thank you for contacting us! We have received your message and will get back to you soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSuccess;
