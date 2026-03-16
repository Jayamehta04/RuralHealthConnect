const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerConfig');

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, upload.single('profilePicture'), updateUserProfile);

module.exports = router;
