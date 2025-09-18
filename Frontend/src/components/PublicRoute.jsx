import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
    // Check if the user's information is stored in localStorage
    const userInfo = localStorage.getItem('userInfo');

    // If userInfo exists, it means the user is logged in.
    // In that case, redirect them to the home page ('/').
    // You could also redirect them to a specific dashboard if you prefer.
    if (userInfo) {
        return <Navigate to="/" replace />;
    }

    // If the user is not logged in, show the page they were trying to access
    // (e.g., the Login or SignUp page). The <Outlet /> renders the child route.
    return <Outlet />;
};

export default PublicRoute;
