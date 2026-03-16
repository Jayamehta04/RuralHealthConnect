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
    isAvailable: { type: Boolean, default: false },
    rating: { type: Number, default: 4.5 },
    location: { type: String },
    diseaseSpecialty: [String],
    profilePicture: { type: String },
    workingHours: {
        type: Map,
        of: new mongoose.Schema({
            start: { type: String, default: '09:00' },
            end: { type: String, default: '17:00' },
            isDayOff: { type: Boolean, default: false }
        }),
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);