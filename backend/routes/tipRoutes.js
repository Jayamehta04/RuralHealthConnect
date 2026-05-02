const express = require('express');
const router = express.Router();
const { addTip, getLatestTip } = require('../controllers/tipController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addTip);
router.get('/latest', getLatestTip); // No protect because patient/any user can see it without necessarily needing stringent tokens sometimes, but passing token is standard. Let's leave it unprotected for easy access if needed, or if patients have token they send it. Wait, the patient side has a token generally but 'latest' is public.

module.exports = router;
