const express = require('express');
const router = express.Router();
const { getDoctors, getConsultedPatients, getPatientHistory, updateSchedule } = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDoctors);
router.get('/consulted', protect, getConsultedPatients);
router.get('/patient-history/:patientId', protect, getPatientHistory);
router.put('/schedule', protect, updateSchedule);

module.exports = router;