'use strict';

const jwt = require('jsonwebtoken');

// The same secret key used in auth.js
const JWT_SECRET = 'your-super-secret-key-that-is-long-and-secure';

// General authentication middleware to check for a valid token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

// Specific RBAC middleware to check for 'police' role
const isPolice = (req, res, next) => {
    if (req.user && req.user.role === 'police') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Access is restricted to police roles only.' });
    }
};

module.exports = {
    auth,
    isPolice
};