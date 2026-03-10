const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db.js'); 

dotenv.config();
const app = express();

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/ambulance', require('./routes/ambulanceRoutes'));

// Basic Route for testing
app.get('/', (req, res) => {
    res.send('RuralHealthConnect Server is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});