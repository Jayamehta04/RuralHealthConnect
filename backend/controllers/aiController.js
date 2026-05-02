const { extractMedicinesFromText, generateHealthAwarenessContent, chatWithAI, generateDailyAwareness } = require('../utils/aiHelper');

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
exports.getAwarenessContent = async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const languageMap = {
      'en': 'English',
      'hi': 'Hindi'
    };
    const targetLanguage = languageMap[lang] || 'English';

    const content = await generateHealthAwarenessContent(targetLanguage);
    res.status(200).json(content);
  } catch (error) {
    console.error('Error generating awareness content:', error);
    res.status(500).json({ message: error.message || 'Error generating awareness content.' });
  }
};

exports.chatWithAI = async (req, res) => {
  try {
    const { message, language, history } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const reply = await chatWithAI(message, language || 'en', history || []);
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    res.status(500).json({ message: error.message || 'Error processing AI chat.' });
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
