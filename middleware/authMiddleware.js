const jwt = require('jsonwebtoken');
const User = require('../models/User.js'); // Make sure this path to your User model is correct

/**
 * Middleware to protect routes.
 * It checks for a valid JWT in the request headers.
 * If valid, it attaches the user's data to the request object.
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header: "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user by the ID from the token and attach it to the request
            // We exclude the password for security
            req.user = await User.findById(decoded.id).select('-passwordHash');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next(); // Proceed to the next middleware or the route handler
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

/**
 * Middleware to authorize roles.
 * This checks if the user's role (attached by the 'protect' middleware)
 * is included in the list of roles allowed to access a route.
 * @param {...String} roles - A list of role strings (e.g., 'admin', 'order-manager').
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            // 403 Forbidden is more appropriate here than 401 Unauthorized
            return res.status(403).json({ 
                message: `Access denied. Role '${req.user.role}' is not authorized for this resource.` 
            });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };