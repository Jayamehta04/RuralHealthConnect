const { extractMedicinesFromText } = require('../utils/aiHelper');

exports.parsePrescription = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Prescription text is required.' });
    }

    const parsedJson = await extractMedicinesFromText(text);
    res.status(200).json(parsedJson);

  } catch (error) {
    console.error('Error parsing prescription in controller:', error);
    res.status(500).json({ message: error.message || 'Error parsing prescription.' });
  }
};
