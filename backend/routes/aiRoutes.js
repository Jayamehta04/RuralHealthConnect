const express = require('express');
const router = express.Router();
const { parsePrescription, getAwarenessContent, chatWithAI, getDailyAwareness } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/parse-prescription', protect, parsePrescription);
router.get('/awareness', getAwarenessContent);
router.post('/chat', protect, chatWithAI);
router.get('/daily-awareness', getDailyAwareness); // Can be unprotected or protected depending on needs.

module.exports = router;
