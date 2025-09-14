'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// In-memory user database (for demonstration purposes)
// In a real application, you would use a proper database like PostgreSQL or MongoDB.
const users = [];

// A secret key for signing JWT tokens. In production, use an environment variable.
const JWT_SECRET = 'your-super-secret-key-that-is-long-and-secure';

// POST /api/auth/register
// Registers a new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, role, region } = req.body;

        // Simple validation
        if (!username || !password || !role || !region) {
            return res.status(400).json({ message: 'Please provide username, password, role, and region.' });
        }

        // Check if user already exists
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and store the new user
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword,
            role, // e.g., 'police', 'ngo'
            region // e.g., 'north', 'south'
        };
        users.push(newUser);

        console.log('User registered:', newUser);
        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/auth/login
// Logs in a user and returns a JWT token
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                region: user.region
            }
        };

        // Sign the token
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;