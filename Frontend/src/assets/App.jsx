import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Import Security & Layout Components ---
import ProtectedRoute from './components/ProtectedRoute.jsx';

import OrderManagerLayout from './components/OrderManagerLayout.jsx';



// --- Import Friend's Pages (Placeholders for now) ---
// Make sure you have created these files from your friend's project
const Home = () => <div className="p-4">Store Home Page</div>;
const OrderTracking = () => <div className="p-4">Order Tracking Page</div>;
const OrderDetails = () => <div className="p-4">Order Details Page</div>;
const AddProductPage = () => <div className="p-4">Add Product Page</div>;
const ProductListPage = () => <div className="p-4">Product List Page</div>;
const ManageOrdersPage = () => <div className="p-4">Manage Orders Page</div>;


export default function App() {
  return (
    <Router>
      <Routes>
        {/* === Public Routes (Accessible to everyone) === */}
        <Route path="/" element={<Home />} />
        <Route path="/order-tracking" element={<OrderTracking />} />
        <Route path="/order-details/:orderId" element={<OrderDetails />} />

        {/* === ORDER MANAGER PROTECTED ROUTES === */}
        {/* This entire section is protected and requires the user to have the 'order_manager' or 'admin' role */}
        <Route element={<ProtectedRoute allowedRoles={['order_manager', 'admin']} />}>
            <Route path="/order-manager" element={<OrderManagerLayout />}>
                 {/* When a manager visits /order-manager, they are redirected to the main orders page */}
                 <Route index element={<Navigate to="/order-manager/orders" replace />} />
                 
                 
                 
                 {/* These are the specific pages for the Order Manager */}
                 <Route path="add-product" element={<AddProductPage />} />
                 <Route path="products" element={<ProductListPage />} />
                 <Route path="orders" element={<ManageOrdersPage />} />
            </Route>
        </Route>

      </Routes>
    </Router>
  );
}

