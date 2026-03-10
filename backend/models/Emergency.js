const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Active', 'Resolved'], 
    default: 'Active' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Emergency', emergencySchema);