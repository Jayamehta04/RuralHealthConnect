const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Feedback = require('../models/Feedback');

const getDoctors = async (req, res) => {
  try {
    const { specialization, location, name, minRating, minExperience, maxExperience, disease } = req.query;

    // Common function to apply filter conditions
    const buildQuery = (base = {}) => {
      const query = { ...base };
      if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
      if (location) query.location = { $regex: location, $options: 'i' };
      if (name) query.name = { $regex: name, $options: 'i' };
      if (disease) query.diseaseSpecialty = { $in: [new RegExp(disease, 'i')] };
      if (minExperience || maxExperience) {
        query.experience = {};
        if (minExperience) query.experience.$gte = Number(minExperience);
        if (maxExperience) query.experience.$lte = Number(maxExperience);
      }
      return query;
    };

    const registeredDoctors = await User.aggregate([
      { $match: buildQuery({ role: 'doctor' }) },
      {
        $lookup: {
          from: 'feedbacks',
          let: { doctorId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$doctor', '$$doctorId'] } } },
            { $sort: { createdAt: -1 } }
          ],
          as: 'feedbacks'
        }
      },
      {
        $addFields: {
          totalReviews: { $size: '$feedbacks' },
          recentFeedback: {
            $slice: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$feedbacks',
                      as: 'fb',
                      cond: { $and: [{ $ne: ['$$fb.comment', null] }, { $ne: ['$$fb.comment', ''] }] }
                    }
                  },
                  as: 'fb',
                  in: '$$fb.comment'
                }
              },
              2
            ]
          }
        }
      },
      { $project: { feedbacks: 0, password: 0, __v: 0 } }
    ]);

    // Fetch seeded doctors from Doctor collection using same filters
    const seededDoctors = await Doctor.aggregate([
      { $match: buildQuery({}) },
      {
        $lookup: {
          from: 'feedbacks',
          let: { doctorId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$doctor', '$$doctorId'] } } },
            { $sort: { createdAt: -1 } }
          ],
          as: 'feedbacks'
        }
      },
      {
        $addFields: {
          totalReviews: { $size: '$feedbacks' },
          recentFeedback: {
            $slice: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$feedbacks',
                      as: 'fb',
                      cond: { $and: [{ $ne: ['$$fb.comment', null] }, { $ne: ['$$fb.comment', ''] }] }
                    }
                  },
                  as: 'fb',
                  in: '$$fb.comment'
                }
              },
              2
            ]
          }
        }
      },
      { $project: { feedbacks: 0, __v: 0 } }
    ]);

    // Function to check if a doctor has an active appointment
    const checkDoctorAvailability = async (doctorId) => {
      try {
        const now = new Date();
        const acceptedAppointments = await Appointment.find({
          doctor: doctorId,
          status: 'accepted'
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
        diseaseSpecialty: doctor.diseaseSpecialty || [],
        totalReviews: doctor.totalReviews || 0,
        recentFeedback: doctor.recentFeedback || []
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
        diseaseSpecialty: doctor.diseaseSpecialty,
        totalReviews: doctor.totalReviews || 0,
        recentFeedback: doctor.recentFeedback || []
      };
    }));

    const allDoctors = [...normalizedRegisteredDoctors, ...normalizedSeededDoctors];

    res.status(200).json(allDoctors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getConsultedPatients = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this route' });
    }

    const appointments = await Appointment.find({
      doctor: req.user.id,
      status: 'Completed'
    }).populate('patient', 'name email phoneNumber specialization');

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getPatientHistory = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this route' });
    }

    const { patientId } = req.params;
    const history = await Appointment.find({
      doctor: req.user.id,
      patient: patientId
    }).populate('patient', 'name email').populate('doctor', 'name specialization');

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this route' });
    }

    const { workingHours } = req.body;
    
    if (!workingHours) {
        return res.status(400).json({ message: 'workingHours is required' });
    }

    // Try finding in User collection first (main system)
    let doctor = await User.findById(req.user.id);
    
    // If not found in User (might be seeded), also update there just in case
    if (!doctor) {
        doctor = await Doctor.findById(req.user.id);
    }
    
    if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.workingHours = workingHours;
    await doctor.save();

    // If they exist in both places (migrated accounts), keep them in sync
    if (doctor.constructor.modelName === 'User') {
        const seededDoc = await Doctor.findById(req.user.id);
        if (seededDoc) {
            seededDoc.workingHours = workingHours;
            await seededDoc.save();
        }
    }

    res.status(200).json({ message: 'Schedule updated successfully', workingHours: doctor.workingHours });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { getDoctors, getConsultedPatients, getPatientHistory, updateSchedule };