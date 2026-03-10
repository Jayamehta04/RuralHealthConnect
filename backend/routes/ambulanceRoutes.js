const express = require('express');
const router = express.Router();
const { requestAmbulance, getAllAmbulanceRequests,updateAmbulanceStatus } = require('../controllers/ambulanceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, requestAmbulance);
router.get('/all', protect, getAllAmbulanceRequests);
router.put('/:id', protect, updateAmbulanceStatus);

module.exports = router;