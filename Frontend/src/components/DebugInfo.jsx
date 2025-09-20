import React, { useState, useEffect } from 'react';

const DebugInfo = () => {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/test');
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
          setError('Backend responded with error');
        }
      } catch (err) {
        setBackendStatus('disconnected');
        setError(err.message);
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <h3 className="font-semibold text-gray-800 mb-2">Debug Info</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Frontend:</span>
          <span className="text-green-600">✓ Running</span>
        </div>
        <div className="flex justify-between">
          <span>Backend:</span>
          <span className={backendStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
            {backendStatus === 'connected' ? '✓ Connected' : '✗ Disconnected'}
          </span>
        </div>
        {error && (
          <div className="text-red-600 text-xs mt-2">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugInfo;
