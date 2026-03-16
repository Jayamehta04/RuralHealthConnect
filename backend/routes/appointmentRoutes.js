const express = require('express');
const router = express.Router();
const { 
    bookAppointment, 
    getMyAppointments, 
    getDoctorAppointments,
    getMyPrescriptions,
    getDoctorPrescriptions,
    getDoctorAvailableSlots,
    updateAppointmentStatus,
    acceptAppointment,
    rejectAppointment,
    completeAppointment,
    cancelAppointment,
    rescheduleAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/book', protect, bookAppointment);
router.get('/slots', protect, getDoctorAvailableSlots);

router.get('/my-appointments', protect, getMyAppointments);

router.get('/doctor-appointments', protect, getDoctorAppointments); 
router.get('/my-prescriptions', protect, getMyPrescriptions);
router.get('/doctor-prescriptions', protect, getDoctorPrescriptions);

router.put('/:id', protect, updateAppointmentStatus);  // legacy generic update
router.put('/:id/accept', protect, acceptAppointment);
router.put('/:id/reject', protect, rejectAppointment);
router.put('/:id/complete', protect, completeAppointment);

router.put('/cancel/:id', protect, cancelAppointment);
router.put('/reschedule/:id', protect, rescheduleAppointment);
module.exports = router;