import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import SessionBooking from '../components/SessionBooking';
import SessionManager from '../components/SessionManager';
import SessionCalendar from '../components/SessionCalendar';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [enrollments, setEnrollments] = useState([]);
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showSessionManager, setShowSessionManager] = useState(false);
    const [showSessionCalendar, setShowSessionCalendar] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const navigate = useNavigate(); // <-- Import and use navigate for redirects

    useEffect(() => {
        const fetchUserProfile = async () => {
            // --- THIS IS THE FIX ---
            // First, get the user info from storage
            const userInfoString = localStorage.getItem('userInfo');

            // Safety Check 1: Make sure there is something in storage
            if (!userInfoString) {
                setError('You are not logged in.');
                setLoading(false);
                navigate('/login'); // Redirect to login if no user info is found
                return;
            }

            try {
                const userInfo = JSON.parse(userInfoString);
                
                // Safety Check 2: Make sure the user info has a token
                if (!userInfo.token) {
                    setError('Authentication token is missing. Please log in again.');
                    setLoading(false);
                    navigate('/login');
                    return;
                }

                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                const { data } = await axios.get('http://localhost:5000/api/users/profile', config);
                setUser(data);
            } catch (err) {
                // This can happen if the token is old or invalid
                setError('Failed to fetch profile data. Your session may have expired.');
                localStorage.removeItem('userInfo'); // Clear the bad data
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    useEffect(() => {
        const fetchEnrollments = async () => {
            if (!user || user.role !== 'customer') return;
            
            setEnrollmentsLoading(true);
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                const { data } = await axios.get('http://localhost:5000/api/enrollments/user', config);
                setEnrollments(data.enrollments || []);
            } catch (err) {
                console.error('Error fetching enrollments:', err);
                // Don't show error for enrollments, just log it
            } finally {
                setEnrollmentsLoading(false);
            }
        };

        if (user) {
            fetchEnrollments();
        }
    }, [user]);

    const handleBookSession = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setShowBookingModal(true);
    };

    const handleViewSessions = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setShowSessionManager(true);
    };

    const handleViewCalendar = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setShowSessionCalendar(true);
    };

    const handleBookingSuccess = () => {
        // Refresh enrollments to show updated session count
        fetchEnrollments();
    };

    const closeModals = () => {
        setShowBookingModal(false);
        setShowSessionManager(false);
        setShowSessionCalendar(false);
        setSelectedEnrollment(null);
    };

    if (loading) return <div className="text-center p-10">Loading profile...</div>;
    
    // Show error and a button to go back to login
    if (error) {
        return (
            <div className="text-center p-10 bg-surface rounded-lg shadow-md">
                <p className="text-red-500">{error}</p>
                <Link to="/login" className="mt-4 inline-block bg-secondary text-white font-bold py-2 px-4 rounded-lg">
                    Go to Login
                </Link>
            </div>
        );
    }
    
    if (!user) return null;

    return (
        <div className="bg-surface rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold text-primary">{user.firstName} {user.lastName}</h1>
                    <p className="text-lg text-text-body mt-1">@{user.username}</p>
                </div>
                <Link 
                    to={user.role === 'admin' ? '/admin/edit-account' : user.role === 'order_manager' ? '/order_manager/edit-account' : '/customer/edit-account'} 
                    className="bg-secondary hover:bg-secondary-hover text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors"
                >
                    Edit Profile
                </Link>
            </div>

            <div className="border-t mt-8 pt-6">
                <h3 className="text-xl font-semibold text-primary mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-text-body">
                    {user.email && <div><strong>Email:</strong> {user.email}</div>}
                    {user.contactNumber && <div><strong>Contact:</strong> {user.contactNumber}</div>}
                    {user.address && <div><strong>Address:</strong> {user.address}</div>}
                    {user.dob && <div><strong>Date of Birth:</strong> {new Date(user.dob).toLocaleDateString()}</div>}
                    <div><strong>Role:</strong> <span className="capitalize">{user.role.replace('_', ' ')}</span></div>
                    <div><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
            </div>

            {/* Enrolled Programs Section - Only show for customers */}
            {user.role === 'customer' && (
                <div className="border-t mt-8 pt-6">
                    <h3 className="text-xl font-semibold text-primary mb-4">Enrolled Programs</h3>
                    {enrollmentsLoading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-text-body">Loading enrollments...</p>
                        </div>
                    ) : enrollments.length > 0 ? (
                        <div className="space-y-4">
                            {enrollments.map((enrollment) => (
                                <div key={enrollment._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-primary text-lg">
                                                {enrollment.program?.title || 'Program Title'}
                                            </h4>
                                            <p className="text-text-body text-sm mt-1">
                                                Coach: {enrollment.program?.coach?.userId?.firstName} {enrollment.program?.coach?.userId?.lastName}
                                            </p>
                                            <p className="text-text-body text-sm">
                                                Duration: {enrollment.program?.duration} weeks
                                            </p>
                                            <p className="text-text-body text-sm">
                                                Fee: ${enrollment.program?.fee}
                                            </p>
                                            <p className="text-text-body text-sm">
                                                Enrolled: {new Date(enrollment.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                enrollment.status === 'paid' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : enrollment.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {enrollment.status === 'paid' ? '✅ Paid' : 
                                                 enrollment.status === 'pending' ? '⏳ Pending' : 
                                                 '❌ Failed'}
                                            </span>
                                            {enrollment.experience && (
                                                <p className="text-text-body text-xs mt-2">
                                                    Experience: {enrollment.experience}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {enrollment.goals && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-text-body text-sm">
                                                <strong>Goals:</strong> {enrollment.goals}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {/* Session Management Buttons */}
                                    {enrollment.status === 'active' && (
                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleBookSession(enrollment)}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    📅 Book Session
                                                </button>
                                                <button
                                                    onClick={() => handleViewSessions(enrollment)}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    📋 My Sessions
                                                </button>
                                                <button
                                                    onClick={() => handleViewCalendar(enrollment)}
                                                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    📊 Calendar View
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-4">🏏</div>
                            <p className="text-text-body">You haven't enrolled in any programs yet.</p>
                            <Link 
                                to="/programs" 
                                className="mt-4 inline-block bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-secondary-hover transition-colors"
                            >
                                Browse Programs
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Session Booking Modal */}
            {showBookingModal && selectedEnrollment && (
                <SessionBooking
                    enrollment={selectedEnrollment}
                    onClose={closeModals}
                    onBookingSuccess={handleBookingSuccess}
                />
            )}

            {/* Session Manager Modal */}
            {showSessionManager && selectedEnrollment && (
                <SessionManager
                    enrollment={selectedEnrollment}
                    onClose={closeModals}
                />
            )}

            {/* Session Calendar Modal */}
            {showSessionCalendar && selectedEnrollment && (
                <SessionCalendar
                    enrollment={selectedEnrollment}
                    onClose={closeModals}
                />
            )}
        </div>
    );
}
