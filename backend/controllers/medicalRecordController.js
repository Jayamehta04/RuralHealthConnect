const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');

// Create a medical record (doctor or patient can create if allowed)
exports.addMedicalRecord = async (req, res) => {
  try {
    const { patientId, diagnosis, notes, prescription } = req.body;

    if (!patientId || !diagnosis) {
      return res.status(400).json({ message: 'patientId and diagnosis are required' });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Only doctor can attach record for a patient other than self
    if (req.user.role !== 'doctor' && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    let attachmentUrls = [];
    if (req.file) {
      // Create a URL path to the file
      const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      attachmentUrls.push(url);
    } else if (req.body.attachments && Array.isArray(req.body.attachments)) {
        // Fallback for old behaviour 
        attachmentUrls = req.body.attachments;
    }

    const newRecord = await MedicalRecord.create({
      patient: patientId,
      doctor: req.user.id,
      diagnosis,
      notes: notes || '',
      prescription: prescription || '',
      attachments: attachmentUrls
    });

    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Add Medical Record ERROR DETAILS:', error);
    console.error('Request Body:', req.body);
    console.error('Request File:', req.file);
    res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
};

exports.getMyMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.user.id })
      .populate('doctor', 'name specialization');

    res.status(200).json(records);
  } catch (error) {
    console.error('Fetch medical records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPatientMedicalRecords = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can view patient records' });
    }

    const patientId = req.params.patientId;

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const records = await MedicalRecord.find({ patient: patientId })
      .populate('doctor', 'name specialization').sort({ createdAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error('Fetch patient records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc    Download prescription as PDF
// @route   GET /api/medical-records/:id/pdf
// @access  Private
exports.downloadPDF = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'name')
      .populate('doctor', 'name specialization location');

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Require PDFKit locally so we don't crash if it's missing during global startup
    const PDFDocument = require('pdfkit');

    // Create a document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers to force download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${record._id}.pdf`);

    // Pipe the PDF document directly to the Express response
    doc.pipe(res);

    // Header Content
    doc.fontSize(20).text('RuralHealthConnect', { align: 'center' });
    doc.fontSize(12).text('Digital Prescription', { align: 'center', color: 'gray' });
    doc.moveDown(2);

    // Doctor Details Section
    doc.rect(50, doc.y, 500, 80).stroke();
    let currentY = doc.y + 10;
    
    doc.fontSize(12).fillColor('black')
       .text(`Doctor: Dr. ${record.doctor.name}`, 60, currentY);
    doc.text(`Specialization: ${record.doctor.specialization || 'N/A'}`, 60, currentY + 20);
    doc.text(`Clinic/Location: ${record.doctor.location || 'N/A'}`, 60, currentY + 40);
    
    doc.text(`Date: ${new Date(record.date).toLocaleDateString()}`, 350, currentY);
    
    doc.moveDown(6); // Move cursor past the box

    // Patient Details Section
    doc.fontSize(14).text('Patient Information', 50, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Name: ${record.patient.name}`);
    doc.moveDown(2);

    // Diagnosis & Prescription
    doc.fontSize(14).text('Diagnosis', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(record.diagnosis || 'No specific diagnosis.');
    doc.moveDown(2);

    doc.fontSize(14).text('Prescription', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(record.prescription || 'No medications prescribed.');
    doc.moveDown(2);

    if (record.notes) {
      doc.fontSize(14).text('Additional Notes', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(record.notes);
    }

    // Footer
    doc.fontSize(10).fillColor('gray').text(
      'This is a digitally generated prescription by RuralHealthConnect and does not require a physical signature.',
      50,
      doc.page.height - 50,
      { align: 'center', width: 500 }
    );

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    console.error('Download PDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error generating PDF' });
    }
  }
};
