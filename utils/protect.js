const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

// Middleware to check if user is logged in
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-passwordHash');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- NEW MIDDLEWARE TO CHECK ROLES ---
// This is a flexible middleware that can accept any number of roles
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            // If the user's role is not in the list of allowed roles, deny access
            return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
        }
        next(); // The user has the correct role, proceed
    };
};

module.exports = { 
    protect,
    authorizeRoles, // <-- EXPORT THE NEW MIDDLEWARE
};
