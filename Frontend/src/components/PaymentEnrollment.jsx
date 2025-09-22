import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PaymentEnrollment({ enrollment, program, onClose }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Auto-redirect to profile after 5 seconds if successful
        if (success) {
            const timer = setTimeout(() => {
                handleGoToProfile();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const handleGoToProfile = () => {
        // Close the modal first
        onClose();
        // Force navigation to profile with a small delay to ensure modal closes
        setTimeout(() => {
            // Use window.location.href for reliable navigation
            window.location.href = '/profile';
        }, 100);
    };

    const handleCompleteEnrollment = async () => {
        setLoading(true);
        setError('');
        
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // Update enrollment status to active
            await axios.put(`http://localhost:5000/api/enrollments/${enrollment._id}/activate`, {}, config);
            
            setSuccess(true);
        } catch (err) {
            console.error('Error completing enrollment:', err);
            setError(err.response?.data?.message || 'Failed to complete enrollment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">🎉 Enrollment Successful!</h2>
                        <p className="text-gray-600 mb-6">
                            Congratulations! You have successfully enrolled in <strong>{program?.title}</strong>. 
                            You can now access your program from your profile page.
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-green-800">
                                <strong>Next Steps:</strong><br/>
                                • 📧 Check your email for enrollment confirmation<br/>
                                • 👤 Visit your profile to manage sessions<br/>
                                • 🏏 Your coach will contact you soon<br/>
                                • 📱 You'll receive program details via email
                            </p>
                        </div>
                        <button
                            onClick={handleGoToProfile}
                            className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Go to Profile
                        </button>
                        <button
                            onClick={handleGoToProfile}
                            className="w-full mt-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Alternative: Direct Link to Profile
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            You will be redirected to your profile automatically in 5 seconds
                        </p>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Having trouble?</strong> 
                                <a href="/profile" className="text-blue-600 underline ml-1">
                                    Click here to go to your profile
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-4">💳</div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Payment Completed</h2>
                    <p className="text-gray-600">
                        Your payment has been processed successfully. Complete your enrollment to start your program.
                    </p>
                </div>

                {/* Enrollment Details */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-lg text-primary mb-4">Enrollment Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Program:</span>
                            <span className="font-medium">{program?.title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Coach:</span>
                            <span className="font-medium">
                                {program?.coach?.userId?.firstName} {program?.coach?.userId?.lastName}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{program?.duration} weeks</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Fee Paid:</span>
                            <span className="font-medium text-green-600">${program?.fee}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium text-blue-600">Payment Complete</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCompleteEnrollment}
                        disabled={loading}
                        className="flex-1 bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:bg-secondary-hover transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Completing...
                            </div>
                        ) : (
                            'Complete Enrollment'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
