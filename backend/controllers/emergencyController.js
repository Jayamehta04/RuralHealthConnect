const Emergency = require('../models/Emergency');
const User = require('../models/User');
const { sendNotification } = require('./notificationController');

// 1. Function to save a new SOS alert
exports.sendSOS = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const newAlert = new Emergency({
      patient: req.user.id, // Comes from your 'protect' middleware
      latitude,
      longitude
    });

    await newAlert.save();

    const doctors = await User.find({ role: 'doctor' });
    await Promise.all(doctors.map((doc) =>
      sendNotification({
        user: doc._id,
        actor: req.user.id,
        type: 'sos_alert',
        title: 'New SOS Alert',
        body: `SOS from patient ID ${req.user.id} at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        link: '/emergency'
      })
    ));

    res.status(201).json({ 
      message: "Emergency alert logged successfully", 
      alert: newAlert 
    });
  } catch (error) {
    console.error("SOS Save Error:", error);
    res.status(500).json({ message: "Server error during SOS logging" });
  }
};

// 2. Function for Doctors to view all SOS alerts
exports.getAllAlerts = async (req, res) => {
  try {
    // We use .populate to get the Patient's name from the User collection
    const alerts = await Emergency.find()
      .populate('patient', 'name') 
      .sort({ createdAt: -1 }); // Shows newest alerts at the top

    res.status(200).json(alerts);
  } catch (error) {
    console.error("Fetch Alerts Error:", error);
    res.status(500).json({ message: "Could not fetch emergency alerts" });
  }
};