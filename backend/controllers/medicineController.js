const Medicine = require('../models/Medicine');

// Add a new medicine reminder
exports.addMedicine = async (req, res) => {
  try {
    const { name, dosage, time, days } = req.body;
    const newMed = new Medicine({
      patient: req.user.id,
      name,
      dosage,
      time,
      days
    });
    await newMed.save();
    res.status(201).json(newMed);
  } catch (error) {
    res.status(500).json({ message: "Error adding medicine" });
  }
};

// Get all medicines for the logged-in patient
exports.getMyMedicines = async (req, res) => {
  try {
    const meds = await Medicine.find({ patient: req.user.id }).sort({ time: 1 });
    res.status(200).json(meds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching medicines" });
  }
};

exports.toggleTaken = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });

    medicine.isTaken = !medicine.isTaken;
    await medicine.save();
    
    res.status(200).json(medicine);
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    if (medicine.patient.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await medicine.deleteOne();
    res.status(200).json({ message: "Medicine removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error during deletion" });
  }
};