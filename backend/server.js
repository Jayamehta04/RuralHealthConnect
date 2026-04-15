const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');

const connectDB = require('./config/db.js'); 
const socketModule = require('./socket');

dotenv.config();
const app = express();

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/ambulance', require('./routes/ambulanceRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/pharmacy', require('./routes/pharmacyRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/healthshorts', require('./routes/healthShortsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
const chatRoute = require('./routes/chatRoutes');
app.use('/api/chat', chatRoute);
console.log('Loaded chat routes:', !!chatRoute);

// Basic Route for testing
app.get('/', (req, res) => {
    res.send('RuralHealthConnect Server is running!');
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketModule.init(server);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close existing process or set PORT to a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = io;