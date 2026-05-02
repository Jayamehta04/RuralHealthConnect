const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  title_en: {
    type: String,
    required: true
  },
  title_hi: {
    type: String,
    required: true
  },
  desc_en: {
    type: String,
    required: true
  },
  desc_hi: {
    type: String,
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or 'Doctor' depending on role system
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Tip', tipSchema);
