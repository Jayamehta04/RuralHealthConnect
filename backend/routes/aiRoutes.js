const express = require('express');
const router = express.Router();
const { parsePrescription, getDailyAwareness } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/parse-prescription', protect, parsePrescription);
router.get('/daily-awareness', getDailyAwareness); // Can be unprotected or protected depending on needs. Making it unprotected for easy fetching.

module.exports = router;
