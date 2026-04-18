const { extractMedicinesFromText, generateDailyAwareness } = require('../utils/aiHelper');

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

exports.getDailyAwareness = async (req, res) => {
  try {
    const { lang = 'en', topic = 'Hydration' } = req.query;
    
    const languageStr = lang === 'hi' ? 'Hindi' : 'English';
    const parsedJson = await generateDailyAwareness(languageStr, topic);
    
    res.status(200).json(parsedJson);

  } catch (error) {
    console.error('Error getting daily awareness in controller:', error);
    res.status(500).json({ message: error.message || 'Error generating daily awareness.' });
  }
};
