const express = require('express');
const router = express.Router();
const { 
    bookAppointment, 
    getMyAppointments, 
    getDoctorAppointments,
    updateAppointmentStatus
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

// Route for booking
router.post('/book', protect, bookAppointment);

// Route for Patients to see their own appointments
router.get('/my-appointments', protect, getMyAppointments);

// Route for Doctors to see their schedule
router.get('/doctor-appointments', protect, getDoctorAppointments); 
router.put('/:id', protect, updateAppointmentStatus);

module.exports = router;