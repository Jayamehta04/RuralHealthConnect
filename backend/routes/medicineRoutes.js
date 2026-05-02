const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware'); // assuming standard auth middleware

router.post('/add', protect, medicineController.addMedicine);
router.get('/today', protect, medicineController.getTodaysMedicines);

module.exports = router;