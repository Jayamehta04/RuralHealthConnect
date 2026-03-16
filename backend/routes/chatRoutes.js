const express = require('express');
const router = express.Router();
const { getConversation, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversation', protect, getConversation);
router.post('/send', protect, sendMessage);

module.exports = router;
