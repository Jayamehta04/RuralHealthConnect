const express = require('express');
const router = express.Router();
const { submitFeedback, getDoctorFeedback, getMyFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitFeedback);
router.get('/doctor/:doctorId', protect, getDoctorFeedback);
router.get('/me', protect, getMyFeedback);

module.exports = router;