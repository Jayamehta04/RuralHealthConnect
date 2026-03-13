const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const doctors = [
  { name: "Arjun Singh", specialization: "General Physician", location: "Bikaner", experience: 10, fees: 200, diseaseSpecialty: ["Fever", "Flu"] },
  { name: "Sita Devi", specialization: "Pediatrician", location: "Ajmer", experience: 8, fees: 300, diseaseSpecialty: ["Child Health"] },
 
];

Doctor.insertMany(doctors)
  .then(() => { console.log("Doctors Seeded!"); process.exit(); })
  .catch(err => console.log(err));