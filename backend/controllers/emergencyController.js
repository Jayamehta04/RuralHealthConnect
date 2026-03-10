const Emergency = require('../models/Emergency');

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