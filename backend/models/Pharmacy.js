const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  stock: { type: Number, default: 100 },
  category: { type: String }, // e.g., "Painkillers", "Antibiotics"
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);