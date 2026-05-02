const Tip = require('../models/Tip');

// @desc    Add a new daily tip
// @route   POST /api/tips/add
const addTip = async (req, res) => {
  try {
    const { title_en, title_hi, desc_en, desc_hi } = req.body;

    if (!title_en || !title_hi || !desc_en || !desc_hi) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const tip = new Tip({
      title_en,
      title_hi,
      desc_en,
      desc_hi,
      doctorId: req.user._id // coming from protect middleware
    });

    const savedTip = await tip.save();
    res.status(201).json(savedTip);
  } catch (error) {
    console.error('Error adding tip:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get latest tip
// @route   GET /api/tips/latest
const getLatestTip = async (req, res) => {
  try {
    const tip = await Tip.findOne().sort({ createdAt: -1 });
    if (!tip) {
      return res.status(404).json({ message: 'No tips found' });
    }
    res.status(200).json(tip);
  } catch (error) {
    console.error('Error fetching tip:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addTip,
  getLatestTip
};
