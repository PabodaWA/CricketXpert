import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Security and Layout Components ---
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import CustomerLayout from './components/CustomerLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx'; 
import OrderManagerLayout from './components/OrderManagerLayout.jsx'; 

// --- Page Components ---
import Login from './components/Login.jsx';
import SignUpMultiStep from './components/SignUpMultiStep.jsx';
import HomePage from './components/HomePage.jsx';
import Profile from './pages/Profile.jsx';
import EditAccount from './pages/EditAccount.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import UserManagement from './pages/UserManagement.jsx'; 
import MyOrders from './pages/MyOrders.jsx';

// --- New E-commerce Pages ---
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import Cart from './pages/Cart.jsx';
import Delivery from './pages/Delivery.jsx';
import Payment from './pages/Payment.jsx';
import OrderSummary from './pages/OrderSummary.jsx';
import Orders from './pages/Orders.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import OrderDetails from './pages/OrderDetails.jsx';

// --- Order Manager Pages ---
import ListOrders from './pages/OrderManager/ListOrders.jsx';
import ListProducts from './pages/OrderManager/ListProducts.jsx';
import AddProducts from './pages/OrderManager/AddProduct.jsx';
// Add other Order Manager page imports here

// --- Placeholder Pages for Admin Dashboard ---
const AdminDashboardOverview = () => <div className="p-4 bg-white rounded-lg shadow"><h2>Admin Dashboard Overview</h2><p>Here you can see site statistics.</p></div>;
const Payments = () => <div className="p-4 bg-white rounded-lg shadow"><h2>All Payments</h2></div>;

export default function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUpMultiStep />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        
        {/* --- E-commerce Public Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/orders" element={<OrderSummary />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/track-order" element={<OrderTracking />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />
        
        {/* --- Legacy Home Route --- */}
        <Route path="/homepage" element={<HomePage />} />

        {/* --- CUSTOMER ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/customer" element={<CustomerLayout />}>
                <Route index element={<Navigate to="/customer/profile" />} />
                <Route path="profile" element={<Profile />} />
                <Route path="edit-account" element={<EditAccount />} />
                <Route path="my-orders" element={<MyOrders />} />
            </Route>
        </Route>

        {/* --- ADMIN ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" />} />
                <Route path="dashboard" element={<AdminDashboardOverview />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="profile" element={<Profile />} />
                <Route path="edit-account" element={<EditAccount />} />
                <Route path="payments" element={<Payments />} />
                <Route path="orders" element={<ListOrders />} />
            </Route>
        </Route>
        
        {/* --- 📦 ORDER MANAGER ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={['order_manager']} />}>
            <Route path="/order_manager" element={<OrderManagerLayout />}>
                <Route index element={<Navigate to="/order_manager/orders" />} />
                <Route path="profile" element={<Profile />} />
                <Route path="edit-account" element={<EditAccount />} />
                <Route path="orders" element={<ListOrders />} />
                <Route path="products" element={<ListProducts />} />
                <Route path="add_product" element={<AddProducts />} />
                {/* You can add more routes for the order manager here */}
            </Route>
        </Route>

      </Routes>
    </Router>
  );
}
