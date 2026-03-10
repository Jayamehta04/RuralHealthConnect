const express = require('express');
const router = express.Router();
const { addMedicine, getMyMedicines, toggleTaken, deleteMedicine } = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addMedicine);
router.get('/my', protect, getMyMedicines);
router.put('/toggle/:id', protect, toggleTaken);
router.delete('/:id', protect, deleteMedicine);

module.exports = router;