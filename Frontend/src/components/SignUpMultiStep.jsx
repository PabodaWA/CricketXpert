import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // <-- IMPORT useNavigate

// --- Data for Sri Lankan Provinces and Districts/Cities ---
const srilankaData = {
  "Central": ["Kandy", "Matale", "Nuwara Eliya"],
  "Eastern": ["Ampara", "Batticaloa", "Trincomalee"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  "North Western": ["Kurunegala", "Puttalam"],
  "Sabaragamuwa": ["Kegalle", "Ratnapura"],
  "Southern": ["Galle", "Hambantota", "Matara"],
  "Uva": ["Badulla", "Monaragala"],
  "Western": ["Colombo", "Gampaha", "Kalutara"]
};
const provinces = Object.keys(srilankaData);


// --- Icon Components ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const EyeOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>;


export default function SignUpMultiStep() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', dob: '', contactNumber: '', address: '',
        profileImageURL: '', email: '', username: '', password: '', confirmPassword: '',
    });
    
    const [addressParts, setAddressParts] = useState({
        province: '', city: '', zone: '', addressLine: '',
    });
    
    const [cities, setCities] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate(); // <-- INITIALIZE useNavigate

    const handleTextOnlyChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value.replace(/[^a-zA-Z\s]/g, '') });
    const handleNumbersOnlyChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        setFormData({ ...formData, [e.target.name]: value });
    };
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddressParts(prev => ({ ...prev, [name]: value }));
        if (name === 'province') {
            setCities(srilankaData[value] || []);
            setAddressParts(prev => ({ ...prev, city: '' }));
        }
    };
    
    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    const handleImageChange = (e) => processFile(e.target.files[0]);
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFile(e.dataTransfer.files[0]);
    };

    const nextStep = () => {
        const requiredFields = [formData.firstName, formData.lastName, formData.email, formData.dob, formData.contactNumber];
        const requiredAddressFields = [addressParts.province, addressParts.city, addressParts.zone, addressParts.addressLine];
        if ([...requiredFields, ...requiredAddressFields].some(field => field.trim() === '')) {
            setError('Please fill in all required fields.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(formData.contactNumber)) {
            setError('Please enter a valid 10-digit phone number starting with 0.');
            return;
        }

        const { addressLine, zone, city, province } = addressParts;
        const combinedAddress = [addressLine, zone, city, province].filter(Boolean).join(', ');
        setFormData(prev => ({ ...prev, address: combinedAddress }));
        setStep(2);
        setError('');
    };

    const prevStep = () => setStep(1);
    const validatePassword = () => {
        const { password, confirmPassword } = formData;
        if (password !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return false;
        }
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            setPasswordError("Password must be 8+ characters, with one uppercase letter, one number, and one symbol.");
            return false;
        }
        setPasswordError('');
        return true;
    };

    // --- UPDATED SUBMIT HANDLER ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validatePassword()) return;
        setLoading(true);
        setMessage('');
        setError('');
        let uploadedImagePath = '';

        if (imageFile) {
            const uploadFormData = new FormData();
            uploadFormData.append('profileImage', imageFile);
            try {
                const uploadConfig = { headers: { 'Content-Type': 'multipart/form-data' } };
                const { data } = await axios.post('http://localhost:5000/api/upload', uploadFormData, uploadConfig);
                uploadedImagePath = data.filePath;
            } catch (uploadError) {
                setError('Image upload failed. Please try again.');
                setLoading(false);
                return;
            }
        }
        try {
            const registrationData = { ...formData, profileImageURL: uploadedImagePath };
            const { data } = await axios.post('http://localhost:5000/api/auth/register', registrationData);

            // --- FIX IS HERE: AUTOMATICALLY LOG THE USER IN ---
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            setMessage("Account created successfully! Redirecting to home page...");
            
            // --- REDIRECT TO HOME PAGE ---
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (regError) {
            setError(regError.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F2F7] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 transition-all duration-500">
                <h2 className="text-3xl font-bold text-center text-[#072679] mb-2">Create Your Account</h2>
                <p className="text-center text-[#36516C] mb-6">Step {step} of 2</p>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className={`w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed  cursor-pointer hover:bg-gray-200 transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} onClick={() => fileInputRef.current.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                            {imagePreview ? <img src={imagePreview} alt="Profile Preview" className="w-full h-full rounded-full object-cover" /> : <div className="flex flex-col items-center justify-center pointer-events-none"><UploadIcon /><p className="text-xs text-gray-500">Drag or Click</p></div>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon /></span><input type="text" name="firstName" placeholder="First Name*" value={formData.firstName} onChange={handleTextOnlyChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" /></div>
                           <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon /></span><input type="text" name="lastName" placeholder="Last Name*" value={formData.lastName} onChange={handleTextOnlyChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" /></div>
                        </div>
                        <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><EmailIcon /></span><input type="email" name="email" placeholder="Email Address*" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" /></div>
                        <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><CalendarIcon /></span><input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5] text-gray-500" /></div>
                        <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><PhoneIcon /></span><input type="tel" name="contactNumber" placeholder="Contact Number*" value={formData.contactNumber} onChange={handleNumbersOnlyChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" /></div>

                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">Address*</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <select name="province" value={addressParts.province} onChange={handleAddressChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5] text-gray-500"><option value="" disabled>Select Province</option>{provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}</select>
                                <select name="city" value={addressParts.city} onChange={handleAddressChange} required disabled={!addressParts.province} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5] text-gray-500 disabled:bg-gray-100"><option value="" disabled>Select City/District</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}</select>
                                <input type="text" name="zone" placeholder="Zone (e.g., Postal Code)*" value={addressParts.zone} onChange={handleAddressChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" />
                                <input type="text" name="addressLine" placeholder="Address Line*" value={addressParts.addressLine} onChange={handleAddressChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" />
                            </div>
                        </div>
                        
                        <button onClick={nextStep} className="w-full bg-[#42ADF5] hover:bg-[#2C8ED1] text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-colors">Next</button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon /></span><input type="text" name="username" placeholder="Username*" value={formData.username} onChange={handleChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" /></div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password*" value={formData.password} onChange={handleChange} required className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                            </button>
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                            <input type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password*" value={formData.confirmPassword} onChange={handleChange} required className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#42ADF5]" />
                               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                            </button>
                        </div>
                        
                        {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                        
                        <div className="flex items-center justify-between space-x-4">
                            <button type="button" onClick={prevStep} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg shadow-lg transition-colors">Back</button>
                            <button type="submit" disabled={loading} className="w-full bg-[#42ADF5] hover:bg-[#2C8ED1] text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-colors disabled:bg-gray-400">{loading ? 'Signing Up...' : 'Sign Up'}</button>
                        </div>
                    </form>
                )}

                {error && <p className="mt-4 text-center text-red-600 font-medium">{error}</p>}
                {message && <p className="mt-4 text-center text-green-600 font-medium">{message}</p>}
            </div>
        </div>
    );
}
