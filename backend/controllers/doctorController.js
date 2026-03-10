const User = require('../models/User');

// @desc    Get all doctors
// @route   GET /api/doctors
exports.getDoctors = async (req, res) => {
    try {
        // Find all users with role 'doctor' and exclude the password field
        const doctors = await User.find({ role: 'doctor' }).select('-password');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};