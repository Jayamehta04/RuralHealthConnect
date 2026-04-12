const Appointment = require('../models/Appointment');
const Medicine = require('../models/Medicine');
const { sendNotification } = require('./notificationController');
const { extractMedicinesFromText } = require('../utils/aiHelper');

// Utility to convert HH:MM into minutes
const convertTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Check overlap of 30-minute slots for same doctor on same date
const isSlotAvailable = async (doctorId, date, time) => {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const requestedStart = convertTimeToMinutes(time);
  const requestedEnd = requestedStart + 30;

  const appointments = await Appointment.find({
    doctor: doctorId,
    date: { $gte: dateStart, $lte: dateEnd },
    status: { $in: ['pending', 'accepted'] }
  });

  for (const appt of appointments) {
    const apptStart = convertTimeToMinutes(appt.time);
    const apptEnd = apptStart + 30;

    if (!(requestedEnd <= apptStart || requestedStart >= apptEnd)) {
      return false;
    }
  }

  return true;
};

// @desc    Book a new appointment
// @route   POST /api/appointments/book
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, time, reason } = req.body;

        if (!doctorId || !date || !time) {
            return res.status(400).json({ message: 'doctorId, date and time are required' });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!dateRegex.test(date) || !timeRegex.test(time)) {
          return res.status(400).json({ message: 'Invalid date or time format' });
        }

        if (!(await isSlotAvailable(doctorId, date, time))) {
          return res.status(400).json({ message: 'Selected slot is already booked' });
        }

        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (appointmentDate < today) {
            return res.status(400).json({ message: 'Please select a valid future date' });
        }

        const appointment = await Appointment.create({
            patient: req.user.id,
            doctor: doctorId,
            date: appointmentDate,
            time,
            reason,
            status: 'pending'
        });

        await sendNotification({
          user: doctorId,
          actor: req.user.id,
          type: 'appointment_request',
          title: 'New appointment request',
          body: `Patient requested appointment on ${date} at ${time}`,
          link: '/doctor-appointments'
        });

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available appointment slots for a doctor on a date
// @route   GET /api/appointments/slots
exports.getDoctorAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctorId and date are required' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Fetch the doctor from either User or Doctor collection to get workingHours
    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    let doctor = await User.findById(doctorId);
    if (!doctor) {
        doctor = await Doctor.findById(doctorId);
    }

    if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
    }

    // Determine the day of the week for the requested date
    const reqDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reqDate < today) {
        return res.status(400).json({ message: 'Please select a valid future date' });
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[reqDate.getDay()]; // e.g., 'Monday'

    // Get the schedule for that day, or fallback to default 9-5
    let daySchedule = { start: '09:00', end: '17:00', isDayOff: false };
    if (doctor.workingHours && doctor.workingHours.has(dayOfWeek)) {
        daySchedule = doctor.workingHours.get(dayOfWeek);
    }

    if (daySchedule.isDayOff) {
        return res.status(200).json({ slots: [], message: 'Doctor is off on this day' });
    }

    const workingStart = convertTimeToMinutes(daySchedule.start);
    const workingEnd = convertTimeToMinutes(daySchedule.end);
    const slotDuration = 30;

    const slots = [];
    for (let m = workingStart; m + slotDuration <= workingEnd; m += slotDuration) {
      const hours = String(Math.floor(m / 60)).padStart(2, '0');
      const minutes = String(m % 60).padStart(2, '0');
      slots.push(`${hours}:${minutes}`);
    }

    const booked = [];
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: dateStart, $lte: dateEnd },
      status: { $in: ['pending', 'accepted'] }
    });

    appointments.forEach((appt) => {
      if (appt.time) booked.push(appt.time);
    });

    const available = slots.filter((slot) => !booked.includes(slot));
    res.status(200).json({ slots: available });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get appointments for the logged in patient
// @route   GET /api/appointments/my-appointments
exports.getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user.id })
            .populate('doctor', '-password');

        const appointmentIds = appointments.map((appt) => appt._id);
        const feedbacks = await require('../models/Feedback').find({ appointment: { $in: appointmentIds } });
        const ratedAppointmentIds = new Set(feedbacks.map((fb) => fb.appointment.toString()));

        const appointmentsWithFeedback = appointments.map((appt) => ({
            ...appt.toObject(),
            hasFeedback: ratedAppointmentIds.has(appt._id.toString())
        }));

        res.json(appointmentsWithFeedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get appointments for the logged in doctor
// @route   GET /api/appointments/doctor-appointments
exports.getDoctorAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctor: req.user.id })
            .populate('patient', '-password');

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prescription history for patient
// @route   GET /api/appointments/my-prescriptions
exports.getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Appointment.find({
      patient: req.user.id,
      prescription: { $ne: '' }
    }).populate('doctor', 'name specialization');

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get prescription history for doctor
// @route   GET /api/appointments/doctor-prescriptions
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Appointment.find({
      doctor: req.user.id,
      prescription: { $ne: '' }
    }).populate('patient', 'name email');

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// status transition helper for doctor action endpoints
const allowedStatus = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];

const updateStatus = async (req, res, newStatus, validCurrent = null) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!allowedStatus.includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const currentStatus = String(appointment.status || '').toLowerCase();
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return res.status(400).json({ message: 'Cannot change a completed or cancelled appointment' });
    }

    if (validCurrent && !validCurrent.map((s) => s.toLowerCase()).includes(currentStatus)) {
      return res.status(400).json({ message: `Cannot set ${newStatus} from status ${appointment.status}` });
    }

    appointment.status = newStatus.toLowerCase();
    if (req.body.doctorNotes) appointment.doctorNotes = req.body.doctorNotes;
    if (req.body.prescription) appointment.prescription = req.body.prescription;
    await appointment.save();

    // Auto-extract medicines to Vault when completed
    if (newStatus === 'completed' && appointment.prescription) {
      extractMedicinesFromText(appointment.prescription).then(async (parsedMeds) => {
        for (const med of parsedMeds) {
          if (!med.medicine || !med.times || med.times.length === 0) continue;
          for (const timeStr of med.times) {
            await Medicine.create({
              patient: appointment.patient,
              name: med.medicine,
              dosage: med.dosage,
              time: timeStr,
              days: ["Everyday"]
            });
          }
        }
      }).catch(err => console.error("Auto vault insertion failed in background:", err.message));
    }

    await sendNotification({
      user: appointment.patient,
      actor: req.user.id,
      type: 'appointment_update',
      title: `Appointment ${appointment.status}`,
      body: `Your appointment on ${appointment.date.toDateString()} at ${appointment.time} is now ${appointment.status}.`,
      link: '/my-appointments'
    });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  const { status, doctorNotes, prescription } = req.body;
  if (!status || !allowedStatus.includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing status' });
  }
  return updateStatus(req, res, status);
};

exports.acceptAppointment = async (req, res) => updateStatus(req, res, 'accepted', ['pending']);
exports.rejectAppointment = async (req, res) => updateStatus(req, res, 'rejected', ['pending']);
exports.completeAppointment = async (req, res) => updateStatus(req, res, 'completed', ['accepted']);
       
    exports.cancelAppointment = async (req, res) => {
      try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
          return res.status(404).json({ message: 'Appointment not found' });
        }
        
        // Check if the logged-in user is the patient who booked it
        if (appointment.patient.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Only allow cancellation if not completed
        if (appointment.status === 'completed') {
          return res.status(400).json({ message: 'Cannot cancel completed appointment' });
        }
        
        appointment.status = 'cancelled';
        await appointment.save();

        await sendNotification({
          user: appointment.doctor,
          actor: req.user.id,
          type: 'appointment_cancelled',
          title: 'Appointment cancelled',
          body: `Patient cancelled appointment on ${new Date(appointment.date).toDateString()} at ${appointment.time}.`,
          link: '/doctor-appointments'
        });
        
        res.status(200).json({ message: 'Appointment cancelled successfully', appointment });
      } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    };
    
    exports.rescheduleAppointment = async (req, res) => {
      try {
        const { date, time } = req.body;
        
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
          return res.status(404).json({ message: 'Appointment not found' });
        }
        
        // Check if the logged-in user is the patient
        if (appointment.patient.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Only allow rescheduling if not completed or cancelled
        if (['completed', 'cancelled'].includes(String(appointment.status || '').toLowerCase())) {
          return res.status(400).json({ message: 'Cannot reschedule completed or cancelled appointment' });
        }
        
        const parsedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDate < today) {
            return res.status(400).json({ message: 'Please select a valid future date' });
        }

        // Reset status to pending when rescheduled
        appointment.date = parsedDate;
        appointment.time = time;
        appointment.status = 'pending'; // Reset to pending for doctor approval
        
        await appointment.save();

        await sendNotification({
          user: appointment.doctor,
          actor: req.user.id,
          type: 'appointment_rescheduled',
          title: 'Appointment rescheduled',
          body: `Patient rescheduled appointment to ${new Date(appointment.date).toDateString()} at ${appointment.time}.`,
          link: '/doctor-appointments'
        });
        
        res.status(200).json({ message: 'Appointment rescheduled successfully', appointment });
      } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    };