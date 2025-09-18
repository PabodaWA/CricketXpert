import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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
        </div>
    );
}
