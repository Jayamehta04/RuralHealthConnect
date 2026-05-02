const User = require('../models/User');
const Doctor = require('../models/Doctor'); // We may need to update Doctor schema as well if it duplicates data

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

        // Role-specific updates
        if (user.role === 'doctor') {
            user.specialization = req.body.specialization || user.specialization;
            user.experience = req.body.experience || user.experience;
            user.location = req.body.location || user.location;
            
            if (req.body.diseaseSpecialty) {
                // Try parsing if it's sent as a JSON string from form-data, otherwise split from commas
                try {
                    user.diseaseSpecialty = JSON.parse(req.body.diseaseSpecialty);
                } catch {
                    user.diseaseSpecialty = req.body.diseaseSpecialty.split(',').map(s => s.trim());
                }
            }
        }

        // Profile Picture Update
        if (req.file) {
            const BASE_URL = process.env.BASE_URL || `http://${req.get('host')}`;
            user.profilePicture = `${BASE_URL}/uploads/${req.file.filename}`;
        }

        const updatedUser = await user.save();

        // If they are a doctor, keep dummy Doctor schema in sync if used for search (ideally this wouldn't exist, but it does)
        if (user.role === 'doctor') {
             // Find matching doctor by name or email (since schemas are a bit disjoint in this codebase)
             await Doctor.findOneAndUpdate(
                 { name: user.name }, 
                 { 
                     specialization: updatedUser.specialization,
                     experience: updatedUser.experience,
                     location: updatedUser.location,
                     diseaseSpecialty: updatedUser.diseaseSpecialty,
                     image: updatedUser.profilePicture
                 }
             ).catch(err => console.log('Doctor sync skipped (not found).'));
        }

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phoneNumber: updatedUser.phoneNumber,
            profilePicture: updatedUser.profilePicture,
            specialization: updatedUser.specialization,
            experience: updatedUser.experience,
            location: updatedUser.location,
            diseaseSpecialty: updatedUser.diseaseSpecialty
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
