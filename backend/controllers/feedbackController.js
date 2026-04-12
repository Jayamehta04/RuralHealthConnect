const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

exports.submitFeedback = async (req, res) => {
  try {
    const { appointmentId, doctorId, comment } = req.body;
    if (!doctorId || !appointmentId) {
      return res.status(400).json({ message: 'doctorId and appointmentId are required' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized or invalid appointment' });
    }

    if (String(appointment.status).toLowerCase() !== 'completed') {
      return res.status(400).json({ message: 'Feedback can only be submitted after completed appointments' });
    }

    const existing = await Feedback.findOne({ appointment: appointmentId, patient: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Feedback for this appointment already submitted' });
    }

    const feedback = await Feedback.create({
      patient: req.user.id,
      doctor: doctorId,
      appointment: appointmentId,
      comment
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDoctorFeedback = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const ratings = await Feedback.find({ doctor: doctorId }).populate('patient', 'name');
    res.status(200).json(ratings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ patient: req.user.id }).populate('doctor', 'name');
    res.status(200).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};