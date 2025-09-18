import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles }) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // 1. Check if the user is logged in
    if (!userInfo || !userInfo.token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Check if the route requires specific roles and if the user has one of them
    // If allowedRoles is provided and the user's role is not in the list, redirect them.
    if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
        // Redirect to a default page or a specific "unauthorized" page
        // For now, we'll send them to their profile.
        return <Navigate to="/profile" replace />;
    }

    // 3. If the user is logged in and has the correct role (or no role is required), show the page
    return <Outlet />;
}
