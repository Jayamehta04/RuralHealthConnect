const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['patient', 'doctor'], 
        default: 'patient' 
    },
    phoneNumber: { type: String },
    // Doctor specific fields (optional for patients)
    specialization: { type: String },
    experience: { type: Number },
    isAvailable: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);