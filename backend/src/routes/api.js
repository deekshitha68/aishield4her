'use strict';

const express = require('express');
const router = express.Router();
const { submitTransaction, evaluateTransaction } = require('../fabricGateway/gateway');
const { auth, isPolice } = require('../middleware/authMiddleware'); // <-- Import new middleware

// Endpoint to create a new abuse record.
// Protected by auth (must be logged in) AND isPolice (must have 'police' role).
router.post('/record', [auth, isPolice], async (req, res) => {
    try {
        const { eventId, timestamp, location, mediaHash, anonymizedDeviceId, eventType } = req.body;
        if (!eventId || !timestamp || !location || !mediaHash || !anonymizedDeviceId || !eventType) {
            return res.status(400).json({ error: 'Missing required fields in request body.' });
        }

        console.log(`Record submitted by user ID: ${req.user.id}, Role: ${req.user.role}`);

        const result = await submitTransaction(
            'createAbuseRecord',
            eventId,
            timestamp,
            location,
            mediaHash,
            anonymizedDeviceId,
            eventType
        );
        res.status(201).send(`Transaction has been submitted. Result: ${result}`);
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        // Check if the error is from the chaincode's RBAC
        if (error.message.includes('is not authorized to create abuse records')) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});

// Endpoints to query records.
// Protected by auth (any logged-in user can view).
router.get('/record/:id', auth, async (req, res) => {
    try {
        const eventId = req.params.id;
        const result = await evaluateTransaction('queryAbuseRecord', eventId);
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

router.get('/records', auth, async (req, res) => {
    try {
        const result = await evaluateTransaction('queryAllRecords');
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;