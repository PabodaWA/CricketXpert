import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Eye, Edit, XCircle, Package, Clock, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

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
            
            // First, update delivery information for all orders
            try {
                await axios.post('http://localhost:5000/api/orders/delivery-check');
                console.log('✅ Delivery information updated');
            } catch (deliveryError) {
                console.warn('⚠️ Could not update delivery information:', deliveryError.message);
                // Continue with fetching orders even if delivery check fails
            }
            
            let url;
            if (selectedStatus) {
                url = `http://localhost:5000/api/orders/status/${selectedStatus}`;
            } else {
                url = 'http://localhost:5000/api/orders?includeCartPending=true';
            }
            const { data } = await axios.get(url);
            setOrders(Array.isArray(data) ? data : []);
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

    // Removed background polling to prevent constant loading state
    
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

    const handleRefreshDeliveryInfo = async () => {
        try {
            setLoading(true);
            await axios.post('http://localhost:5000/api/orders/delivery-check');
            console.log('✅ Delivery information refreshed');
            // Refresh the orders list
            await fetchOrders();
            alert('Delivery information updated successfully! All completed orders now have delivery dates calculated (Order Date + 7 days).');
        } catch (error) {
            console.error('Error refreshing delivery info:', error);
            alert('Failed to refresh delivery information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDeliveryInfo = (order) => {
        if (order.status === 'completed' && order.deliveryDate) {
            const deliveryDate = new Date(order.deliveryDate);
            const remainingDays = order.remainingDays || 0;
            
            if (remainingDays > 0) {
                return {
                    text: `Expected delivery: ${deliveryDate.toLocaleDateString()}`,
                    countdown: `${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`,
                    color: 'text-blue-600'
                };
            } else if (remainingDays === 0) {
                return {
                    text: `Expected delivery: ${deliveryDate.toLocaleDateString()}`,
                    countdown: 'Delivery expected today',
                    color: 'text-orange-600'
                };
            }
        } else if (order.status === 'delivered') {
            return {
                text: 'Order delivered successfully',
                countdown: 'Delivered',
                color: 'text-green-600'
            };
        }
        return null;
    };

    // Function to check if an order is delayed
    const isOrderDelayed = (order) => {
        if (order.status !== 'completed' || !order.deliveryDate) {
            return false;
        }
        const today = new Date();
        const deliveryDate = new Date(order.deliveryDate);
        return today > deliveryDate;
    };

    const getStatusPill = (status, order = null) => {
        // Check if order is delayed (either manually set or auto-detected)
        if (status === 'delayed' || (order && isOrderDelayed(order))) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={14} /> delayed</span>;
        }
        
        const statuses = {
            created: { icon: <Package size={14} />, color: 'bg-blue-100 text-blue-800' },
            processing: { icon: <Clock size={14} />, color: 'bg-yellow-100 text-yellow-800' },
            completed: { icon: <CheckCircle size={14} />, color: 'bg-green-100 text-green-800' },
            delivered: { icon: <CheckCircle size={14} />, color: 'bg-emerald-100 text-emerald-800' },
            cancelled: { icon: <XCircle size={14} />, color: 'bg-red-100 text-red-800' },
            cart_pending: { icon: <Clock size={14} />, color: 'bg-gray-100 text-gray-800' },
            default: { icon: <Package size={14} />, color: 'bg-gray-100 text-gray-800' }
        };
        const { icon, color } = statuses[status] || statuses.default;
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{icon} {status}</span>;
    };

    // Filter orders based on search query and status
    const filteredOrders = orders.filter(order => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (
            order._id.toLowerCase().includes(searchLower) ||
            order.customerId?.toLowerCase().includes(searchLower) ||
            order.address?.toLowerCase().includes(searchLower) ||
            order.status?.toLowerCase().includes(searchLower)
        );
        
        // Handle delayed filter
        if (selectedStatus === 'delayed') {
            return matchesSearch && (order.status === 'delayed' || isOrderDelayed(order));
        }
        
        return matchesSearch && (selectedStatus === '' || order.status === selectedStatus);
    });

    // Calculate order statistics
    const orderStats = {
        total: orders.length,
        cart_pending: orders.filter(order => order.status === 'cart_pending').length,
        created: orders.filter(order => order.status === 'created').length,
        processing: orders.filter(order => order.status === 'processing').length,
        completed: orders.filter(order => order.status === 'completed').length,
        delivered: orders.filter(order => order.status === 'delivered').length,
        cancelled: orders.filter(order => order.status === 'cancelled').length,
        delayed: orders.filter(order => order.status === 'delayed' || isOrderDelayed(order)).length
    };

    // Calculate total amount of all orders
    const totalAmount = orders.reduce((sum, order) => {
        const amount = order.amount ?? order.total ?? 0;
        return sum + amount;
    }, 0);

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
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="delayed">Delayed</option>
                        </select>
                        <button
                            onClick={handleRefreshDeliveryInfo}
                            className="flex items-center gap-2 px-4 py-2 bg-[#42ADF5] text-white rounded-lg hover:bg-[#2C8ED1] transition-colors"
                            title="Refresh delivery information"
                        >
                            <RefreshCw size={16} />
                            <span className="hidden sm:inline">Refresh Delivery</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-700">{orderStats.completed}</p>
                        </div>
                        <CheckCircle className="text-green-500" size={24} />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Delivered</p>
                            <p className="text-2xl font-bold text-emerald-700">{orderStats.delivered}</p>
                        </div>
                        <CheckCircle className="text-emerald-500" size={24} />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Delayed</p>
                            <p className="text-2xl font-bold text-red-700">{orderStats.delayed}</p>
                        </div>
                        <AlertTriangle className="text-red-500" size={24} />
                    </div>
                </div>
            </div>

            {/* Total Amount Section */}
            <div className="bg-gradient-to-r from-[#072679] to-[#0a3a9e] p-6 rounded-2xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Total Amount of Orders</h2>
                        <p className="text-blue-100">Sum of all order amounts in the system</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">LKR {totalAmount.toFixed(2)}</div>
                        <div className="text-blue-100 text-sm">Across {orderStats.total} orders</div>
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
                                    <th className="p-4">Order / Token</th>
                                    <th className="p-4">Customer / Product</th>
                                    <th className="p-4">Amount / Total</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Delivery Date(Date+7)</th>
                                    <th className="p-4">Days Remaining</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                           <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-500">
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => {
                                        const isCartPendingRow = order.type === 'cart_pending' || order.status === 'cart_pending';
                                        const baseRowClass = 'border-b hover:bg-gray-50';
                                        const pendingBg = isCartPendingRow ? 'bg-gray-50' : '';
                                        return (
                                        <tr key={order._id} className={`${baseRowClass} ${pendingBg}`}>
                                           <td className="p-4 font-mono text-xs text-gray-600">
                                               {isCartPendingRow ? (
                                                   <span className="inline-flex items-center gap-2">
                                                       <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 text-[10px] font-semibold">PENDING</span>
                                                       <span>...{String(order.cartToken || order._id).slice(-8)}</span>
                                                   </span>
                                               ) : (
                                                   <>...{order._id.slice(-8)}</>
                                               )}
                                           </td>
                                           <td className="p-4 text-sm font-medium text-gray-800">
                                               {isCartPendingRow ? (order.productTitle || 'Unknown Product') : (<>{order.customerId?.slice(-8) || 'N/A'}...</>)}
                                           </td>
                                           <td className="p-4 font-semibold text-[#072679]">LKR {(order.amount ?? order.total ?? 0).toFixed(2)}</td>
                                           <td className="p-4">{getStatusPill(order.status, order)}</td>
                                           <td className="p-4 text-sm text-gray-500">{new Date(order.date || order.createdAt).toLocaleDateString()}</td>
                                           <td className="p-4 text-sm text-gray-600">
                                               {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}
                                           </td>
                                           <td className="p-4 text-center">
                                               {order.remainingDays !== undefined && order.remainingDays !== null ? (
                                                   <span className={`px-3 py-2 rounded-full text-sm font-bold ${
                                                       order.remainingDays === 0 ? 'bg-orange-100 text-orange-800' :
                                                       order.remainingDays > 0 ? 'bg-blue-100 text-blue-800' :
                                                       'bg-green-100 text-green-800'
                                                   }`}>
                                                       {order.remainingDays === 0 ? '✓' :
                                                        order.remainingDays > 0 ? `${order.remainingDays}` :
                                                        'Delivered'}
                                                   </span>
                                               ) : '-'}
                                           </td>
                                           <td className="p-4">
                                                {isCartPendingRow ? (
                                                    <div className="text-xs text-gray-400">Read-only</div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
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
                                                    </div>
                                                )}
                                           </td>
                                       </tr>
                                        );
                                    })
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
                                {formatDeliveryInfo(selectedOrder) && (
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-600">Delivery Information</p>
                                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-medium text-gray-800">
                                                {formatDeliveryInfo(selectedOrder).text}
                                            </p>
                                            <p className={`text-sm font-semibold ${formatDeliveryInfo(selectedOrder).color}`}>
                                                {formatDeliveryInfo(selectedOrder).countdown}
                                            </p>
                                            {selectedOrder.deliveryDate && (
                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                    <p className="text-xs text-gray-600 font-medium">Calculation:</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleDateString()} + 7 days = {new Date(selectedOrder.deliveryDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="delayed">Delayed</option>
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
