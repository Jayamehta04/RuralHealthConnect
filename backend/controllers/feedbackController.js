const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const updateDoctorRating = async (doctorId) => {
  const result = await Feedback.aggregate([
    { $match: { doctor: doctorId } },
    {
      $group: {
        _id: '$doctor',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    const { avgRating } = result[0];
    await User.findByIdAndUpdate(doctorId, { rating: avgRating.toFixed(1) }, { new: true });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { appointmentId, doctorId, rating, comment } = req.body;
    if (!doctorId || rating == null || !appointmentId) {
      return res.status(400).json({ message: 'doctorId, appointmentId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
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
      rating,
      comment
    });

    await updateDoctorRating(doctorId);
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