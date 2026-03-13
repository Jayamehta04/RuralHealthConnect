const Appointment = require('../models/Appointment');

// @desc    Book a new appointment
// @route   POST /api/appointments/book
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, time, reason } = req.body;

        if (!doctorId || !date || !time) {
            return res.status(400).json({ message: 'doctorId, date and time are required' });
        }

        // Parse the date string (YYYY-MM-DD) to a Date object
        const appointmentDate = new Date(date);

        const appointment = await Appointment.create({
            patient: req.user.id,
            doctor: doctorId,
            date: appointmentDate,
            time,
            reason,
            // Use the schema default status (Pending) to avoid invalid enum values
            status: 'Pending'
        });

        res.status(201).json(appointment);
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

        res.json(appointments);
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

// @desc    Update appointment status
// @route   PUT /api/appointments/:id
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, doctorNotes } = req.body; 
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, doctorNotes }, 
      { new: true }
    );

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
       
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
        if (appointment.status === 'Completed') {
          return res.status(400).json({ message: 'Cannot cancel completed appointment' });
        }
        
        appointment.status = 'Cancelled';
        await appointment.save();
        
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
        if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
          return res.status(400).json({ message: 'Cannot reschedule completed or cancelled appointment' });
        }
        
        // Reset status to Pending when rescheduled
        appointment.date = new Date(date);
        appointment.time = time;
        appointment.status = 'Pending'; // Reset to pending for doctor approval
        
        await appointment.save();
        
        res.status(200).json({ message: 'Appointment rescheduled successfully', appointment });
      } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    };