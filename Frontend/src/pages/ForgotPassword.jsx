import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code and new password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleRequestCode = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setMessage(data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/reset-password', { email, code, password });
            setMessage(data.message + ' Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F2F7] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-center text-[#072679] mb-2">Forgot Password</h2>
                <p className="text-center text-[#36516C] mb-8">
                    {step === 1 ? 'Enter your email to receive a password reset code.' : 'Enter the code and your new password.'}
                </p>

                <form onSubmit={step === 1 ? handleRequestCode : handleResetPassword} className="space-y-6">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><MailIcon /></span>
                        <input 
                            type="email" 
                            placeholder="Your Email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]"
                            readOnly={step === 2}
                        />
                    </div>

                    {step === 2 && (
                        <>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><CodeIcon /></span>
                                <input type="text" placeholder="6-Digit Code" value={code} onChange={(e) => setCode(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                                <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" />
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={loading} className="w-full bg-[#42ADF5] hover:bg-[#2C8ED1] text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-colors disabled:bg-gray-400">
                        {loading ? (step === 1 ? 'Sending...' : 'Resetting...') : (step === 1 ? 'Send Reset Code' : 'Reset Password')}
                    </button>
                    
                    {step === 2 && (
                        <div className="text-center">
                            <a href="#" onClick={(e) => { e.preventDefault(); handleRequestCode(); }} className="text-sm font-medium text-[#42ADF5] hover:underline">
                                Didn't receive a code? Resend it.
                            </a>
                        </div>
                    )}
                </form>

                {error && <p className="mt-4 text-center text-red-600 font-medium">{error}</p>}
                {message && <p className="mt-4 text-center text-green-600 font-medium">{message}</p>}
            </div>
        </div>
    );
}
