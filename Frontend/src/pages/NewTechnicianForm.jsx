import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTechnician } from '../api/technicianApi';
import { fetchUserByUsername } from '../api/repairRequestApi';
import { generateUserFriendlyId } from '../utils/friendlyId';
import Brand from '../brand';

const NewTechnicianForm = () => {
  const navigate = useNavigate();
  
  // Username lookup state
  const [usernameInput, setUsernameInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    skills: [],
    available: true
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const SKILL_OPTIONS = [
    'Cricket Bat Repair',
    'Cricket Ball Repair',
    'Gloves Repair',
    'Pads Repair',
    'Helmet Repair',
    'General Equipment',
    'All Equipment Types'
  ];

  const handleUsernameCheck = async () => {
    setLookupError('');
    setApiError('');
    const username = usernameInput.trim();
    if (!username) {
      setLookupError('Please enter a username');
      return;
    }
    setLookupLoading(true);
    try {
      const data = await fetchUserByUsername(username);
      console.log('Raw data from fetchUserByUsername:', data);
      
      // The normalizeUser function already returns the correct structure
      const normalized = data;
      console.log('Normalized user data:', normalized);
      console.log('Username from normalized data:', normalized.username);
      console.log('ID from normalized data:', normalized.id);
      console.log('Email from normalized data:', normalized.email);
      
      if (!normalized.id || !normalized.email) {
        throw new Error('notfound');
      }
      
      setCurrentUser(normalized);
      try { localStorage.setItem('cx_current_user', JSON.stringify(normalized)); } catch {}
    } catch (err) {
      console.error('Error in handleUsernameCheck:', err);
      setLookupError('No user found with that username. Please check and try again.');
      setCurrentUser(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleUsernameInputFocus = (e) => {
    // Ensure cursor is visible when input is focused
    e.target.style.cursor = 'text';
  };

  const handleSkillChange = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const validateForm = () => {
    const next = {};
    
    if (!currentUser) next.currentUser = 'Please validate the username first.';
    if (formData.skills.length === 0) next.skills = 'Please select at least one skill';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const [firstName, ...rest] = (currentUser?.name || '').split(' ');
      const lastName = rest.join(' ').trim();
      
      const payload = {
        username: currentUser?.username,
        firstName: firstName || currentUser?.name || '',
        lastName: lastName || '',
        email: currentUser?.email,
        phone: currentUser?.phone,
        skills: formData.skills,
        available: formData.available
      };

      console.log('Current user object:', currentUser);
      console.log('Sending payload to create technician:', payload);
      console.log('Username being sent:', currentUser?.username);
      const response = await createTechnician(payload);
      
      if (response.status === 201 || response.data) {
        const defaultPassword = response.data?.defaultPassword || 'technician123';
        const message = defaultPassword === 'User already has an account' 
          ? `Technician added successfully!\n\nThis user already has an account in the system.`
          : `Technician added successfully!\n\nDefault password: ${defaultPassword}\n\nPlease share this password with the technician.`;
        alert(message);
        // Navigate to both dashboards - user can choose which one to use
        const goToManager = window.confirm('Technician added successfully! Would you like to go to the Service Manager Dashboard? Click OK for Manager Dashboard, Cancel for Technician Dashboard.');
        if (goToManager) {
          navigate('/manager');
        } else {
          navigate('/technician');
        }
      } else {
        setApiError('Failed to add technician. Please try again.');
      }
    } catch (error) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to add technician.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl" style={{ border: `2px solid ${Brand.secondary}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: Brand.light }}>
          <h1 className="text-xl font-bold" style={{ color: Brand.primary }}>🔧 Add New Technician</h1>
          <div className="flex items-center gap-3">
            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="px-6 py-4">
          {!currentUser && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: Brand.secondary }}>
                <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Enter Username or Name</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onFocus={handleUsernameInputFocus}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text"
                    style={{ borderColor: Brand.secondary }}
                    placeholder="e.g., john_smith or John Smith"
                    autoComplete="username"
                    tabIndex="1"
                  />
                  <button
                    type="button"
                    onClick={handleUsernameCheck}
                    disabled={lookupLoading}
                    className="px-4 py-2 rounded-lg text-white font-semibold"
                    style={{ backgroundColor: Brand.secondary }}
                  >
                    {lookupLoading ? 'Checking...' : 'Continue'}
                  </button>
                </div>
                {lookupError && <p className="text-red-500 text-sm mt-2">{lookupError}</p>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3" style={{ color: Brand.primary }}>Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>Full Name</label>
                  <input type="text" value={currentUser?.name || ''} readOnly disabled className={`w-full px-3 py-2 border rounded-lg bg-gray-100 ${errors.customerName ? 'border-red-500' : 'border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>Email Address</label>
                  <input type="email" value={currentUser?.email || ''} readOnly disabled className={`w-full px-3 py-2 border rounded-lg bg-gray-100 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>Phone Number</label>
                  <input type="tel" value={currentUser?.phone || ''} readOnly disabled className={`w-full px-3 py-2 border rounded-lg bg-gray-100 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>User ID</label>
                  <input type="text" value={generateUserFriendlyId(currentUser?.id) || ''} readOnly disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300" />
                </div>
              </div>
              {errors.currentUser && <p className="text-red-500 text-sm mt-2">{errors.currentUser}</p>}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3" style={{ color: Brand.primary }}>Skills & Availability</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Skills *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {SKILL_OPTIONS.map((skill) => (
                      <label key={skill} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => handleSkillChange(skill)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm" style={{ color: Brand.body }}>{skill}</span>
                      </label>
                    ))}
                  </div>
                  {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium" style={{ color: Brand.body }}>Available for assignments</span>
                  </label>
                </div>
              </div>
            </div>

            {apiError && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B' }}>
                {apiError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 px-1 pb-4">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border" style={{ borderColor: Brand.secondary, color: Brand.body }}>Cancel</button>
              <button type="submit" disabled={isSubmitting || !currentUser} className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${isSubmitting || !currentUser ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ backgroundColor: Brand.secondary }} onMouseOver={(e) => { if(!(isSubmitting || !currentUser)) e.currentTarget.style.backgroundColor = Brand.primaryHover; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = Brand.secondary; }}>
                {isSubmitting ? 'Adding...' : 'Add Technician'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewTechnicianForm;
