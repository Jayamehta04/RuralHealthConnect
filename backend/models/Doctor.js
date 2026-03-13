const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true }, // e.g., Cardiologist, General Physician
  location: { type: String, required: true },       // e.g., Jaipur, Rural Block A
  experience: { type: Number, required: true },     // Years of practice
  rating: { type: Number, default: 4.5 },
  fees: { type: Number, required: true },
  availability: { type: Boolean, default: true },   // For the live call feature later
  diseaseSpecialty: [String],                       // e.g., ["Diabetes", "Hypertension"]
  image: { type: String }                           // URL to a profile photo
});

module.exports = mongoose.model('Doctor', DoctorSchema);