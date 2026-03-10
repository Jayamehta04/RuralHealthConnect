const express = require('express');
const router = express.Router();
const { sendSOS, getAllAlerts } = require('../controllers/emergencyController'); 
const { protect } = require('../middleware/authMiddleware');

// Route for Patients to send an alert
router.post('/send', protect, sendSOS);

// Route for Doctors to view all alerts
router.get('/all', protect, getAllAlerts);

module.exports = router;