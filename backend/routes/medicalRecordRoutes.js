const express = require('express');
const router = express.Router();
const { addMedicalRecord, getMyMedicalRecords, getPatientMedicalRecords, downloadPDF } = require('../controllers/medicalRecordController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerConfig');

router.post('/', protect, upload.single('attachment'), addMedicalRecord);
router.get('/me', protect, getMyMedicalRecords);
router.get('/patient/:patientId', protect, getPatientMedicalRecords);
router.get('/:id/pdf', protect, downloadPDF);

module.exports = router;
