const express = require('express');
const router = express.Router();
const { 
    bookAppointment, 
    getMyAppointments, 
    getDoctorAppointments,
    updateAppointmentStatus,
    cancelAppointment,
    rescheduleAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/book', protect, bookAppointment);

router.get('/my-appointments', protect, getMyAppointments);

router.get('/doctor-appointments', protect, getDoctorAppointments); 
router.put('/:id', protect, updateAppointmentStatus);

router.put('/cancel/:id', protect, cancelAppointment);
router.put('/reschedule/:id', protect, rescheduleAppointment);
module.exports = router;