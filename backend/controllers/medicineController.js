const Medicine = require('../models/Medicine');

exports.addMedicine = async (req, res) => {
  try {
    const { name, dosage, times, duration } = req.body;
    const userId = req.user.id;

    if (!name || !dosage || !times || !duration) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newMedicine = new Medicine({
      userId,
      name,
      dosage,
      times,
      duration: parseInt(duration),
      startDate: new Date()
    });

    await newMedicine.save();
    res.status(201).json({ message: 'Medicine added successfully', medicine: newMedicine });
  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ message: 'Server error adding medicine' });
  }
};

exports.getTodaysMedicines = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    const medicines = await Medicine.find({ userId }).sort({ createdAt: -1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter valid medicines based on startDate + duration
    const validMedicines = medicines.filter(med => {
      const startDate = new Date(med.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + med.duration);
      
      return today >= startDate && today < endDate;
    });

    res.status(200).json({ medicines: validMedicines });
  } catch (error) {
    console.error('Error fetching todays medicines:', error);
    res.status(500).json({ message: 'Server error fetching medicines' });
  }
};