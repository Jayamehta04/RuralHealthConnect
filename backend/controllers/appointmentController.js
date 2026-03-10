const Appointment = require('../models/Appointment');

// @desc    Book a new appointment
// @route   POST /api/appointments/book
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, time, reason } = req.body;

        if (!doctorId || !date || !time) {
            return res.status(400).json({ message: 'doctorId, date and time are required' });
        }

        const appointment = await Appointment.create({
            patient: req.user.id,
            doctor: doctorId,
            date,
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
    