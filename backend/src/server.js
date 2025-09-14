'use strict';

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth'); // <-- ADD THIS LINE

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes); // <-- ADD THIS LINE
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('AIShield4Her Backend API is running!');
});

app.listen(PORT, HOST, () => {
    console.log(`Running on http://${HOST}:${PORT}`);
});