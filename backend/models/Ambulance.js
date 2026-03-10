const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  pickupAddress: { 
    type: String, 
    required: true 
  },
  contactNumber: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Dispatched', 'Arrived', 'Completed'], 
    default: 'Pending' 
  },
  latitude: { 
    type: Number 
  },
  longitude: { 
    type: Number 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Ambulance', ambulanceSchema);