const express = require('express');
const router = express.Router();
const { parsePrescription } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/parse-prescription', protect, parsePrescription);

module.exports = router;
