import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// --- Icon Components ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const EyeOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>;


export default function Login() {
    // --- State for Login Form ---
    const [formData, setFormData] = useState({ loginIdentifier: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();


    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // --- Main Login Submission Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/login', formData);
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            // Correct Logic
            if (data.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (data.role === 'order_manager') {
                    // Redirecting to the default page we set up in App.jsx
                navigate('/order_manager/orders'); 
            } else {
                     // Redirect customers and all other roles to home
                 navigate('/'); 
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-primary">Welcome Back!</h2>
                    <p className="text-text-body">Sign in to continue to CricketExpert.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon /></span>
                        <input type="text" name="loginIdentifier" value={formData.loginIdentifier} onChange={handleChange} placeholder="Email or Username" required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary" />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                        <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Password" required className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                        </button>
                    </div>
                    <div className="flex items-center justify-end text-sm">
                        <Link to="/forgot-password" className="font-medium text-secondary hover:underline">Forgot Password?</Link>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-colors disabled:bg-gray-400">
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                {error && <p className="text-center text-red-600 font-medium">{error}</p>}

                <p className="text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-secondary hover:underline">
                        Sign Up Here
                    </Link>
                </p>
            </div>

        </div>
    );
}
