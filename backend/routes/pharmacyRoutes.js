const express = require('express');
const router = express.Router();
const { getStoreMedicines, placeOrder } = require('../controllers/pharmacyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/store', protect, getStoreMedicines);
router.post('/order', protect, placeOrder);

module.exports = router;