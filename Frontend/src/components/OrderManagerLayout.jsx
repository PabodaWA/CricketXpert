import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

// --- Icon Components ---
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const ShoppingBagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;


export default function OrderManagerLayout() {
    const [showSidebar, setShowSidebar] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (storedUserInfo) {
            setUserInfo(storedUserInfo);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };
    
    // Helper to determine if a link is active
    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <div className="min-h-screen bg-[#F1F2F7]">
            {showSidebar && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setShowSidebar(false)}></div>}

            {/* Fixed Sidebar */}
            <aside className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-xl transform transition-transform duration-300 z-40 ${
                showSidebar ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0`}>
                <div className="p-4 flex flex-col h-screen">
                    <div className="mb-8 text-center">
                         <img 
                            src={userInfo?.profileImageURL ? `http://localhost:5000${userInfo.profileImageURL}` : `https://placehold.co/100x100/072679/FFFFFF?text=${userInfo?.username?.charAt(0).toUpperCase()}`}
                            alt="Manager Profile"
                            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-[#072679]"
                        />
                        <h2 className="text-xl font-bold text-[#072679]">Order Management</h2>
                        <p className="text-sm text-gray-500">{userInfo?.username}</p>
                    </div>

                    <nav className="space-y-1 flex-grow overflow-y-auto">
                        <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">My Account</p>
                        <Link to="/order_manager/profile" className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/order_manager/profile') ? 'bg-[#42ADF5] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                           <UserCircleIcon /> My Profile
                        </Link>
                         <Link to="/order_manager/edit-account" className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/order_manager/edit-account') ? 'bg-[#42ADF5] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                           <CogIcon /> Edit Profile
                        </Link>

                        <p className="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase">Manager Functions</p>
                        <Link to="/order_manager/add_product" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/order-manager/add-product') ? 'bg-[#42ADF5] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                           <PlusIcon /> Add Product
                        </Link>
                        <Link to="/order_manager/products" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/order-manager/products') ? 'bg-[#42ADF5] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                           <ClipboardListIcon /> Product List
                        </Link>
                         <Link to="/order_manager/orders" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/order-manager/orders') ? 'bg-[#42ADF5] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                           <ShoppingBagIcon /> Manage Orders
                        </Link>
                    </nav>

                    <div className="mt-auto pt-4">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-red-500 bg-red-100 hover:bg-red-200 transition-colors">
                           <LogoutIcon /> Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:ml-64">
                {/* Mobile Header */}
                <header className="p-4 bg-white shadow-md lg:hidden sticky top-0 z-20">
                    <button onClick={() => setShowSidebar(true)}>
                        <svg className="w-6 h-6 text-[#072679]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </header>
                
                {/* Main Content */}
                <main className="min-h-screen p-4 lg:p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
