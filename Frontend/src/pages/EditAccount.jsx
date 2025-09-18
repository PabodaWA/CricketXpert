import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Data for Sri Lankan Provinces and Districts/Cities ---
const srilankaData = {
  "Central": ["Kandy", "Matale", "Nuwara Eliya"],
  "Eastern": ["Ampara", "Batticaloa", "Trincomalee"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  "North Western": ["Kurunegala", "Puttalam"],
  "Sabaragamawa": ["Kegalle", "Ratnapura"],
  "Southern": ["Galle", "Hambantota", "Matara"],
  "Uva": ["Badulla", "Monaragala"],
  "Western": ["Colombo", "Gampaha", "Kalutara"]
};
const provinces = Object.keys(srilankaData);

// --- Icon Components ---
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const EyeOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>;


export default function EditAccount() {
    // --- State Management ---
    const [formData, setFormData] = useState({ firstName: '', lastName: '', dob: '', contactNumber: '' });
    const [addressParts, setAddressParts] = useState({ province: '', city: '', zone: '', addressLine: '' });
    const [cities, setCities] = useState([]);
    
    // Image uploader state
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // Password state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // UI state
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // --- Data Fetching and Parsing ---
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get('http://localhost:5000/api/users/profile', config);

                // Populate basic form data
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    contactNumber: data.contactNumber || '',
                    dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
                });
                setImagePreview(data.profileImageURL ? `http://localhost:5000${data.profileImageURL}` : '');

                // --- Smart Address Parsing ---
                if (data.address) {
                    const parts = data.address.split(',').map(part => part.trim());
                    const province = provinces.find(p => p === parts[parts.length - 1]);
                    if (province) {
                        const city = srilankaData[province].find(c => c === parts[parts.length - 2]);
                        setAddressParts({
                            addressLine: parts.slice(0, parts.length - 3).join(', ') || parts[0],
                            zone: city ? parts[parts.length - 3] : '',
                            city: city || '',
                            province: province,
                        });
                        setCities(srilankaData[province] || []);
                    } else {
                        setAddressParts({ addressLine: data.address, zone: '', city: '', province: '' });
                    }
                }
            } catch (err) {
                setError('Failed to fetch profile data.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserProfile();
    }, []);

    // --- Handlers for Inputs and Image Upload ---
    const handleTextOnlyChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value.replace(/[^a-zA-Z\s]/g, '') });
    const handleNumbersOnlyChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) });
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
    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); };

    // --- Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setPasswordError('');

        // 1. Validate phone number
        const phoneRegex = /^0\d{9}$/;
        if (formData.contactNumber && !phoneRegex.test(formData.contactNumber)) {
            setError('Please enter a valid 10-digit phone number starting with 0.');
            return;
        }

        // 2. Validate password if it's being changed
        if (password) {
            if (password !== confirmPassword) {
                setPasswordError('Passwords do not match.');
                return;
            }
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
            if (!passwordRegex.test(password)) {
                setPasswordError("Password must be 8+ characters, with one uppercase letter, one number, and one symbol.");
                return;
            }
        }
        
        setSubmitting(true);
        let uploadedImagePath;
        let finalData = { ...formData };

        // 3. Upload image if a new one was selected
        if (imageFile) {
            const uploadFormData = new FormData();
            uploadFormData.append('profileImage', imageFile);
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const uploadConfig = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.post('http://localhost:5000/api/upload', uploadFormData, uploadConfig);
                uploadedImagePath = data.filePath;
                finalData.profileImageURL = uploadedImagePath;
            } catch (uploadError) {
                setError('Image upload failed. Please try again.');
                setSubmitting(false);
                return;
            }
        }

        // 4. Combine address and add password
        finalData.address = [addressParts.addressLine, addressParts.zone, addressParts.city, addressParts.province].filter(Boolean).join(', ');
        if (password) {
            finalData.password = password;
        }

        // 5. Submit all data to the profile update endpoint
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put('http://localhost:5000/api/users/profile', finalData, config);
            
            // OPTIONAL: Update local storage with new info if necessary
            // This prevents needing to re-fetch on the profile page
            const updatedUserInfo = { ...userInfo, ...finalData };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

            if (userInfo.role === 'admin') {
                navigate('/admin/profile');
            } else if (userInfo.role === 'order_manager') {
                navigate('/order_manager/profile');
            } else {
                navigate('/customer/profile');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-10">Loading account details...</div>;

    return (
        <div className="bg-surface rounded-2xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-primary mb-8">Edit Your Account</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* --- IMAGE UPLOADER --- */}
                <div className="flex flex-col items-center space-y-2">
                    <label className="block text-sm font-medium text-text-body">Profile Picture</label>
                    <div 
                        className={`w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed  cursor-pointer hover:bg-gray-200 transition-colors ${isDragging ? 'border-secondary bg-blue-50' : 'border-gray-300'}`}
                        onClick={() => fileInputRef.current.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Profile Preview" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="text-center pointer-events-none"><UploadIcon /><p className="text-xs text-gray-500">Drag or Click</p></div>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>

                {/* --- PERSONAL DETAILS --- */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-text-body">First Name</label><input type="text" name="firstName" value={formData.firstName} onChange={handleTextOnlyChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary" /></div>
                    <div><label className="block text-sm font-medium text-text-body">Last Name</label><input type="text" name="lastName" value={formData.lastName} onChange={handleTextOnlyChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary" /></div>
                </div>
                 <div><label className="block text-sm font-medium text-text-body">Date of Birth</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary" /></div>
                <div><label className="block text-sm font-medium text-text-body">Contact Number</label><input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleNumbersOnlyChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary" /></div>

                {/* --- ADDRESS --- */}
                 <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-text-body mb-2">Address</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select name="province" value={addressParts.province} onChange={handleAddressChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary"><option value="" disabled>Select Province</option>{provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}</select>
                        <select name="city" value={addressParts.city} onChange={handleAddressChange} disabled={!addressParts.province} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary disabled:bg-gray-100"><option value="" disabled>Select City/District</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}</select>
                        <input type="text" name="zone" placeholder="Zone (e.g., Postal Code)" value={addressParts.zone} onChange={handleAddressChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary" />
                        <input type="text" name="addressLine" placeholder="Address Line" value={addressParts.addressLine} onChange={handleAddressChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary" />
                    </div>
                </div>

                {/* --- PASSWORD CHANGE --- */}
                <div className="border-t pt-4">
                    <p className="text-text-body text-sm mb-2">Change Password (optional)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-text-body">New Password</label>
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg pr-10" />
                             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 flex items-center pr-3">
                                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                            </button>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-text-body">Confirm New Password</label>
                            <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 flex items-center pr-3">
                                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                            </button>
                        </div>
                    </div>
                    {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                </div>

                {error && <p className="text-red-500 text-center font-medium">{error}</p>}

                {/* --- ACTION BUTTONS --- */}
                <div className="flex justify-end space-x-4 pt-4">
                    <button 
                        type="button" 
                        onClick={() => {
                            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                            if (userInfo.role === 'admin') {
                                navigate('/admin/profile');
                            } else if (userInfo.role === 'order_manager') {
                                navigate('/order_manager/profile');
                            } else {
                                navigate('/customer/profile');
                            }
                        }} 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="bg-secondary hover:bg-secondary-hover text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
