const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const getDoctors = async (req, res) => {
  try {
    const { specialization, location, name } = req.query;

    // Fetch registered doctors from User collection
    let userQuery = { role: 'doctor' };
    if (specialization) {
      userQuery.specialization = specialization;
    }
    if (name) {
      userQuery.name = { $regex: name, $options: 'i' };
    }
    const registeredDoctors = await User.find(userQuery);

    // Fetch seeded doctors from Doctor collection
    let doctorQuery = {};
    if (specialization) {
      doctorQuery.specialization = specialization;
    }
    if (location) {
      doctorQuery.location = { $regex: location, $options: 'i' };
    }
    if (name) {
      doctorQuery.name = { $regex: name, $options: 'i' };
    }
    const seededDoctors = await Doctor.find(doctorQuery);

    // Function to check if a doctor has an active appointment
    const checkDoctorAvailability = async (doctorId) => {
      try {
        const now = new Date();
        const acceptedAppointments = await Appointment.find({
          doctor: doctorId,
          status: 'Accepted'
        });

        for (const appt of acceptedAppointments) {
          try {
            const [hours, minutes] = appt.time.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) continue;
            const startTime = new Date(appt.date);
            startTime.setHours(hours, minutes, 0, 0);
            const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes later

            if (now >= startTime && now <= endTime) {
              return false; // Busy
            }
          } catch (err) {
            console.error('Error parsing appointment time:', err);
            continue;
          }
        }
        return true; // Available
      } catch (err) {
        console.error('Error checking doctor availability:', err);
        return true; // Default to available on error
      }
    };

    // Check availability for registered doctors
    const normalizedRegisteredDoctors = await Promise.all(registeredDoctors.map(async (doctor) => {
      const isAvailable = await checkDoctorAvailability(doctor._id);
      return {
        _id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        experience: doctor.experience,
        isAvailable,
        location: doctor.location || 'Not specified',
        fees: doctor.fees || 0,
        diseaseSpecialty: doctor.diseaseSpecialty || []
      };
    }));

    // Check availability for seeded doctors
    const normalizedSeededDoctors = await Promise.all(seededDoctors.map(async (doctor) => {
      const isAvailable = await checkDoctorAvailability(doctor._id);
      return {
        _id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        experience: doctor.experience,
        isAvailable,
        location: doctor.location,
        fees: doctor.fees,
        diseaseSpecialty: doctor.diseaseSpecialty
      };
    }));

    const allDoctors = [...normalizedRegisteredDoctors, ...normalizedSeededDoctors];

    res.status(200).json(allDoctors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { getDoctors };