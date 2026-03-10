const express = require('express');
const router = express.Router();
const { getDoctors } = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');

// Protect this route so only logged-in users can see doctors
router.get('/', protect, getDoctors);

module.exports = router;