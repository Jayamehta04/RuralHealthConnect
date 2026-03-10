const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    reason: {
        type: String
    },
    status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Completed', 'Cancelled'], 
    default: 'Pending'
},
doctorNotes: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
