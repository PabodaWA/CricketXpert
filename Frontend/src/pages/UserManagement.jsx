import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// --- Icon Components ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;


// --- Reusable Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-600 mt-2 mb-4">{message}</p>
                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Confirm</button>
                </div>
            </div>
        </div>
    );
};

// --- Add/Edit User Modal Component ---
const UserModal = ({ isOpen, onClose, onSave, user, roles }) => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', role: 'customer' });
    const isEditMode = !!user;

    useEffect(() => {
        if (isEditMode && user) {
            setFormData({ firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, role: user.role, password: '' });
        } else {
            setFormData({ firstName: '', lastName: '', username: '', email: '', password: '', role: 'customer' });
        }
    }, [user, isEditMode, isOpen]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, user?._id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{isEditMode ? 'Edit User' : 'Add New Staff'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="w-full px-3 py-2 border rounded" required />
                        <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="w-full px-3 py-2 border rounded" required />
                    </div>
                    <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="w-full px-3 py-2 border rounded" required />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full px-3 py-2 border rounded" required />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditMode ? "New Password (optional)" : "Password"} className="w-full px-3 py-2 border rounded" required={!isEditMode} />
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border rounded" required>
                        {roles.map(role => <option key={role} value={role}>{role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[#42ADF5] text-white rounded-md hover:bg-[#2C8ED1]">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main User Management Page ---
export default function UserManagement() {
    // --- State Management ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);

    const allRoles = ['coach', 'technician', 'customer','coaching_manager' ,'order_manager', 'ground_manager', 'service_manager', 'delivery_staff'];
    const managerRoles = ['coaching_manager', 'order_manager', 'ground_manager', 'service_manager'];

    // --- Data Fetching ---
    const fetchUsers = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/users', config);
            setUsers(data);
        } catch (err) {
            setError('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchUsers(); }, []);

    // --- Filtering and Searching (Live) ---
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesRole = true;
            if (roleFilter === 'all') {
                matchesRole = user.role !== 'admin';
            } else if (roleFilter === 'managers') {
                matchesRole = managerRoles.includes(user.role);
            } else {
                matchesRole = user.role === roleFilter;
            }

            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    // --- Handlers for CRUD Actions ---
    const handleSaveUser = async (formData, userId) => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        try {
            if (userId) { // Update existing user
                await axios.put(`http://localhost:5000/api/users/${userId}`, formData, config);
            } else { // Create new user
                await axios.post('http://localhost:5000/api/users', formData, config);
            }
            fetchUsers(); // Refresh the user list
            setIsUserModalOpen(false);
            setEditingUser(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save user.');
        }
    };

    const handleDelete = (user) => {
        setActionToConfirm({ type: 'delete', user });
        setIsConfirmModalOpen(true);
    };

    const handleBlock = (user) => {
        setActionToConfirm({ type: 'block', user });
        setIsConfirmModalOpen(true);
    };

    const confirmAction = async () => {
        if (!actionToConfirm) return;
        const { type, user } = actionToConfirm;
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        try {
            if (type === 'delete') {
                await axios.delete(`http://localhost:5000/api/users/${user._id}`, config);
            } else if (type === 'block') {
                const newStatus = user.status === 'active' ? 'suspended' : 'active';
                await axios.put(`http://localhost:5000/api/users/${user._id}/status`, { status: newStatus }, config);
            }
            fetchUsers();
        } catch (err) {
            alert('Action failed.');
        } finally {
            setIsConfirmModalOpen(false);
            setActionToConfirm(null);
        }
    };

    // --- Render Logic ---
    if (loading) return <div>Loading users...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            {/* --- Header and Controls --- */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl font-bold text-[#072679]">User Management</h1>
                    <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="flex items-center px-4 py-2 bg-[#42ADF5] text-white rounded-md hover:bg-[#2C8ED1]">
                        <PlusIcon /> Add Staff
                    </button>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    >
                        <option value="all">All Users</option>
                        <option value="managers">All Managers</option>
                        {allRoles.map(role => <option key={role} value={role}>{role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                </div>
            </div>

            {/* --- User Cards Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                    <div key={user._id} className="bg-white rounded-lg shadow-md p-5 flex flex-col">
                        <div className="flex items-center mb-4">
                            <img src={user.profileImageURL ? `http://localhost:5000${user.profileImageURL}` : `https://placehold.co/64x64/E2E8F0/4A5568?text=${user.username.charAt(0)}`} alt="profile" className="w-16 h-16 rounded-full object-cover mr-4"/>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{user.firstName} {user.lastName}</h3>
                                <p className="text-sm text-gray-500">@{user.username}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 flex-grow">
                            <p className="flex items-center"><UserIcon /> <span className="ml-2 capitalize">{user.role.replace('_', ' ')}</span></p>
                            <p className="flex items-center"><MailIcon /> <span className="ml-2">{user.email}</span></p>
                            {user.contactNumber && <p className="flex items-center"><PhoneIcon /> <span className="ml-2">{user.contactNumber}</span></p>}
                            <p className="flex items-center"><span className={`w-3 h-3 rounded-full mr-2 ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span> <span className="capitalize">{user.status}</span></p>
                            {user.address && <p className="flex items-start"><LocationIcon /> <span className="ml-2">{user.address}</span></p>}
                        </div>
                        <div className="border-t mt-4 pt-4 flex justify-end space-x-2">
                            <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Edit</button>
                            <button onClick={() => handleBlock(user)} className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">
                                {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button onClick={() => handleDelete(user)} className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200">Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- Modals --- */}
            <UserModal 
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                user={editingUser}
                roles={allRoles}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmAction}
                title={`Confirm ${actionToConfirm?.type === 'delete' ? 'Deletion' : 'Status Change'}`}
                message={`Are you sure you want to ${actionToConfirm?.type} the user "${actionToConfirm?.user.username}"? This action cannot be undone.`}
            />
        </div>
    );
}
