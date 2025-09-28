import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CertificateDownload = ({ enrollmentId, enrollmentStatus, onCertificateGenerated }) => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  // Debug logging
  console.log('CertificateDownload component rendered with:', { enrollmentId, enrollmentStatus });

  useEffect(() => {
    if (enrollmentId) {
      checkEligibility();
    }
  }, [enrollmentId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get token from localStorage
      const token = localStorage.getItem('token') || localStorage.getItem('userInfo');
      let authToken = token;
      
      // If token is in userInfo object, parse it
      if (token && token.includes('{')) {
        try {
          const userInfo = JSON.parse(token);
          authToken = userInfo.token;
        } catch (e) {
          console.log('Token is not JSON, using as is');
        }
      }
      
      console.log('Checking certificate eligibility with token:', authToken ? 'Present' : 'Missing');
      
      const response = await axios.get(
        `http://localhost:5000/api/certificates/eligibility/${enrollmentId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      if (response.data.success) {
        setEligibility(response.data.data);
        console.log('Certificate eligibility data:', response.data.data);
      } else {
        setError('Failed to check certificate eligibility');
      }
    } catch (err) {
      console.error('Error checking certificate eligibility:', err);
      setError(err.response?.data?.message || 'Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    try {
      setGenerating(true);
      setError('');
      
      const response = await axios.post(
        `http://localhost:5000/api/certificates/generate/${enrollmentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Update eligibility data
        setEligibility(prev => ({
          ...prev,
          certificate: response.data.data.certificate,
          enrollment: {
            ...prev.enrollment,
            certificateIssued: true
          }
        }));
        
        if (onCertificateGenerated) {
          onCertificateGenerated(response.data.data.certificate);
        }
      } else {
        setError('Failed to generate certificate');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      if (!eligibility?.certificate?.id) return;
      
      const response = await axios.get(
        `http://localhost:5000/api/certificates/download/${eligibility.certificate.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${eligibility.certificate.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      setError('Failed to download certificate');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Checking certificate eligibility...</span>
        </div>
      </div>
    );
  }

  if (!eligibility) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="text-center text-gray-500 py-4">
          <div className="text-gray-400 text-4xl mb-2">📋</div>
          <p className="text-sm mb-2">Certificate information unavailable</p>
          {error && (
            <p className="text-xs text-red-500">Error: {error}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Check browser console for details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Certificate of Completion
        </h3>
        {eligibility.certificate ? (
          <span className="text-sm text-green-600 font-medium">
            ✓ Certificate Available
          </span>
        ) : eligibility.eligibility.isEligible ? (
          <span className="text-sm text-blue-600 font-medium">
            🎓 Ready for Certificate
          </span>
        ) : (
          <span className="text-sm text-orange-600 font-medium">
            📋 Working Towards Certificate
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Certificate Requirements Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Certificate Requirements
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>To earn your Certificate of Completion, you must meet these conditions:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Attend at least <strong>75% of all program sessions</strong></li>
            <li>Complete at least <strong>75% of program requirements</strong></li>
            <li>Have an <strong>active or completed</strong> enrollment status</li>
          </ul>
        </div>
      </div>

      {/* Eligibility Status */}
      <div className="mb-4">
        <div className="grid grid-cols-1 gap-4 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {eligibility.eligibility.attendancePercentage}%
            </div>
            <div className="text-sm text-gray-600">Attendance</div>
            <div className={`text-xs ${eligibility.eligibility.requirements.attendanceMet ? 'text-green-600' : 'text-red-600'}`}>
              {eligibility.eligibility.requirements.attendanceMet ? '✓ Met' : '✗ Required: 75%'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {eligibility.eligibility.attendedSessions} of {eligibility.eligibility.totalSessions} sessions
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Attendance Progress</span>
              <span>{eligibility.eligibility.attendancePercentage}% / 75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  eligibility.eligibility.requirements.attendanceMet 
                    ? 'bg-green-500' 
                    : eligibility.eligibility.attendancePercentage >= 50 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(eligibility.eligibility.attendancePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          
        </div>

        <div className="text-center mt-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            eligibility.eligibility.isEligible 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {eligibility.eligibility.isEligible ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Eligible for Certificate
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Working Towards Certificate
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {eligibility.certificate ? (
          <button
            onClick={downloadCertificate}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Certificate
          </button>
        ) : eligibility.eligibility.isEligible ? (
          <button
            onClick={generateCertificate}
            disabled={generating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Generate Certificate
              </>
            )}
          </button>
        ) : (
          <div className="flex-1">
            <div className="text-center text-gray-600 py-2 mb-2">
              <div className="text-sm font-medium mb-1">Keep Going! You're making progress</div>
              <div className="text-xs text-gray-500">
                {eligibility.eligibility.attendancePercentage < 75 && (
                  <div>Attend {Math.ceil((75 - eligibility.eligibility.attendancePercentage) / 100 * eligibility.eligibility.totalSessions)} more sessions</div>
                )}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> Attend all scheduled sessions and complete assignments to earn your certificate!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Details */}
      {eligibility.certificate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Certificate Number:</span>
              <span className="font-mono">{eligibility.certificate.certificateNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Issue Date:</span>
              <span>{new Date(eligibility.certificate.issueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Downloads:</span>
              <span>{eligibility.certificate.downloadCount || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateDownload;
