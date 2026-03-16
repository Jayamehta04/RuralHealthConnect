const Ambulance = require('../models/Ambulance');
const { sendNotification } = require('./notificationController');

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

    const doctors = await require('../models/User').find({ role: 'doctor' });
    await Promise.all(doctors.map((doc) =>
      sendNotification({
        user: doc._id,
        actor: req.user.id,
        type: 'ambulance_request',
        title: 'New ambulance request',
        body: `Patient ${req.user.id} needs ambulance at ${pickupAddress}`,
        link: '/ambulance'
      })
    ));

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

    if (updatedRequest) {
      await sendNotification({
        user: updatedRequest.patient,
        actor: req.user.id,
        type: 'ambulance_update',
        title: 'Ambulance status updated',
        body: `Your ambulance request status is now ${status}`,
        link: '/ambulance'
      });
    }

    res.status(200).json({ message: "Status updated", updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};