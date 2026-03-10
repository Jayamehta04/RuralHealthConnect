const Ambulance = require('../models/Ambulance');

// 1. Function for Patients to request an ambulance
exports.requestAmbulance = async (req, res) => {
  try {
    const { pickupAddress, contactNumber, latitude, longitude } = req.body;
    
    const request = new Ambulance({
      patient: req.user.id, 
      pickupAddress,
      contactNumber,
      latitude,
      longitude
    });

    await request.save();
    res.status(201).json({ 
      message: "Ambulance request submitted", 
      request 
    });
  } catch (error) {
    console.error("Ambulance Request Error:", error);
    res.status(500).json({ message: "Error processing request" });
  }
};

// 2. Function for Doctors/Admins to see all ambulance requests
exports.getAllAmbulanceRequests = async (req, res) => {
  try { 
    const requests = await Ambulance.find()
      .populate('patient', 'name')
      .sort({ createdAt: -1 }); 

    res.status(200).json(requests);
  } catch (error) {
    console.error("Fetch Ambulance Error:", error);
    res.status(500).json({ message: "Could not fetch ambulance requests" });
  }
};

exports.updateAmbulanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedRequest = await Ambulance.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({ message: "Status updated", updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};