import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Eye, Edit, Trash2, XCircle, Package, Clock, CheckCircle } from 'lucide-react';

// Reusable Modal Component
const Modal = ({ isOpen, onClose, children }) => {
    console.log('Modal render - isOpen:', isOpen);
    
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <XCircle size={24} />
                    </button>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function ListOrders() {
    const [orders, setOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    
    // Debug selectedOrder state changes
    useEffect(() => {
        console.log('selectedOrder state changed:', selectedOrder);
    }, [selectedOrder]);
    
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const url = selectedStatus ? `http://localhost:5000/api/orders/status/${selectedStatus}` : 'http://localhost:5000/api/orders/';
            const { data } = await axios.get(url);
            setOrders(data);
        } catch (err) { 
            console.error('Error fetching orders:', err);
            alert('Error fetching orders: ' + (err.response?.data?.message || err.message));
        }
        finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => fetchOrders(), 300);
        return () => clearTimeout(handler);
    }, [searchQuery, selectedStatus]);
    
    const handleUpdateStatus = async (id, status) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.put(`http://localhost:5000/api/orders/${id}`, { status }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchOrders();
            alert('Order status updated successfully!');
        } catch (err) { 
            console.error('Error updating status:', err);
            alert('Error updating status: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteOrder = async (id) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                await axios.delete(`http://localhost:5000/api/orders/${id}`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                fetchOrders();
                alert('Order deleted successfully!');
            } catch (err) {
                console.error('Error deleting order:', err);
                alert('Error deleting order: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleEditOrder = (order) => {
        setEditingOrder(order);
    };

    const handleSaveEdit = async () => {
        if (!editingOrder) return;
        
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.put(`http://localhost:5000/api/orders/${editingOrder._id}`, { status: editingOrder.status }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchOrders();
            setEditingOrder(null);
            alert('Order status updated successfully!');
        } catch (err) {
            console.error('Error updating order status:', err);
            alert('Error updating order status: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCancelEdit = () => {
        setEditingOrder(null);
    };

    const handleEditChange = (field, value) => {
        setEditingOrder(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getStatusPill = (status) => {
        const statuses = {
            created: { icon: <Package size={14} />, color: 'bg-blue-100 text-blue-800' },
            processing: { icon: <Clock size={14} />, color: 'bg-yellow-100 text-yellow-800' },
            completed: { icon: <CheckCircle size={14} />, color: 'bg-green-100 text-green-800' },
            cancelled: { icon: <XCircle size={14} />, color: 'bg-red-100 text-red-800' },
            cart_pending: { icon: <Clock size={14} />, color: 'bg-gray-100 text-gray-800' },
            default: { icon: <Package size={14} />, color: 'bg-gray-100 text-gray-800' }
        };
        const { icon, color } = statuses[status] || statuses.default;
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{icon} {status}</span>;
    };

    // Filter orders based on search query
    const filteredOrders = orders.filter(order => {
        const searchLower = searchQuery.toLowerCase();
        return (
            order._id.toLowerCase().includes(searchLower) ||
            order.customerId?.toLowerCase().includes(searchLower) ||
            order.address?.toLowerCase().includes(searchLower) ||
            order.status?.toLowerCase().includes(searchLower)
        );
    });

    // Calculate order statistics
    const orderStats = {
        total: orders.length,
        cart_pending: orders.filter(order => order.status === 'cart_pending').length,
        created: orders.filter(order => order.status === 'created').length,
        processing: orders.filter(order => order.status === 'processing').length,
        completed: orders.filter(order => order.status === 'completed').length,
        cancelled: orders.filter(order => order.status === 'cancelled').length
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h1 className="text-3xl font-bold text-[#072679] mb-4">Order Management</h1>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search by Order ID, Customer..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg" 
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="text-gray-400" size={20} />
                        <select 
                            value={selectedStatus} 
                            onChange={(e) => setSelectedStatus(e.target.value)} 
                            className="border rounded-lg px-4 py-2"
                        >
                            <option value="">All Statuses</option>
                            <option value="cart_pending">Cart Pending</option>
                            <option value="created">Created</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Dashboard Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-[#072679]">{orderStats.total}</p>
                        </div>
                        <Package className="text-blue-500" size={24} />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-gray-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Cart Pending</p>
                            <p className="text-2xl font-bold text-gray-700">{orderStats.cart_pending}</p>
                        </div>
                        <Clock className="text-gray-500" size={24} />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Created</p>
                            <p className="text-2xl font-bold text-blue-700">{orderStats.created}</p>
                        </div>
                        <Package className="text-blue-500" size={24} />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Processing</p>
                            <p className="text-2xl font-bold text-yellow-700">{orderStats.processing}</p>
                        </div>
                        <Clock className="text-yellow-500" size={24} />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-700">{orderStats.completed}</p>
                        </div>
                        <CheckCircle className="text-green-500" size={24} />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Cancelled</p>
                            <p className="text-2xl font-bold text-red-700">{orderStats.cancelled}</p>
                        </div>
                        <XCircle className="text-red-500" size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#072679] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading orders...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                           <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                   <tr key={order._id} className="border-b hover:bg-gray-50">
                                       <td className="p-4 font-mono text-xs text-gray-600">...{order._id.slice(-8)}</td>
                                       <td className="p-4 text-sm font-medium text-gray-800">{order.customerId?.slice(-8) || 'N/A'}...</td>
                                       <td className="p-4 font-semibold text-[#072679]">LKR {order.amount?.toFixed(2)}</td>
                                       <td className="p-4">{getStatusPill(order.status)}</td>
                                       <td className="p-4 text-sm text-gray-500">{new Date(order.date || order.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            console.log('View button clicked for order:', order);
                                                            console.log('Setting selectedOrder to:', order);
                                                            setSelectedOrder(order);
                                                        }} 
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                                        title="View Details"
                                                        type="button"
                                                    >
                                                        <Eye size={16}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditOrder(order)} 
                                                        className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                                                        title="Edit Order"
                                                    >
                                                        <Edit size={16}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteOrder(order._id)} 
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                   </tr>
                                    ))
                                )}
                           </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* View Order Modal */}
            <Modal isOpen={!!selectedOrder} onClose={() => {
                console.log('Closing view modal');
                setSelectedOrder(null);
            }}>
                {selectedOrder && (
                    <div>
                        <h2 className="text-2xl font-bold text-[#072679] mb-4">Order Details</h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Order ID</p>
                                    <p className="font-mono text-sm">{selectedOrder._id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Customer ID</p>
                                    <p className="font-mono text-sm">{selectedOrder.customerId || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Amount</p>
                                    <p className="text-lg font-semibold text-[#072679]">LKR {selectedOrder.amount?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <div className="mt-1">{getStatusPill(selectedOrder.status)}</div>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="text-sm">{selectedOrder.address || 'No address provided'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-600">Date</p>
                                    <p className="text-sm">{new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <h3 className="font-bold text-lg mb-3">Order Items</h3>
                                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedOrder.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">
                                                        {item.productId?.name || `Product ID: ${item.productId}` || 'Unknown Product'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">LKR {item.priceAtOrder?.toFixed(2) || '0.00'}</p>
                                                    <p className="text-sm text-gray-600">each</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No items found in this order</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Order Status Modal */}
            <Modal isOpen={!!editingOrder} onClose={handleCancelEdit}>
                {editingOrder && (
                    <div>
                        <h2 className="text-2xl font-bold text-[#072679] mb-4">Update Order Status</h2>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Order ID: {editingOrder._id}</p>
                                <p className="text-sm text-gray-600 mb-2">Customer: {editingOrder.customerId?.slice(-8)}...</p>
                                <p className="text-sm text-gray-600">Amount: LKR {editingOrder.amount?.toFixed(2)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                                <div className="mb-4">{getStatusPill(editingOrder.status)}</div>
                                
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                                <select 
                                    value={editingOrder.status} 
                                    onChange={(e) => handleEditChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072679]"
                                >
                                    <option value="cart_pending">Cart Pending</option>
                                    <option value="created">Created</option>
                                    <option value="processing">Processing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button 
                                    onClick={handleCancelEdit}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveEdit}
                                    className="px-6 py-2 bg-[#072679] text-white rounded-lg hover:bg-[#051a5a] transition-colors"
                                >
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
