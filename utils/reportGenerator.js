import PDFDocument from 'pdfkit';
import { sendEmail } from './notification.js'; // email function
import path from 'path';

// Generates PDF and pipes to response, and returns buffer to send via email
const generateRepairReportBuffer = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => {
        console.error('PDF generation error:', err);
        reject(err);
      });

      // Add logo with proper alignment
      try {
        const logoPath = path.join(process.cwd(), 'Frontend', 'src', 'assets', 'cricketexpert.png');
        // Center the logo horizontally and position it at the top
        const logoWidth = 80;
        const logoHeight = 40;
        const pageWidth = 612; // Standard PDF page width
        const logoX = (pageWidth - logoWidth) / 2; // Center horizontally
        doc.image(logoPath, logoX, 30, { width: logoWidth, height: logoHeight });
        console.log('Logo added to PDF with proper alignment');
      } catch (err) {
        console.log('Logo not found, continuing without logo:', err.message);
      }
      
      console.log('Generating PDF for repair ID:', data._id);

      // Header
      doc.fontSize(24).text('CRICKET EXPERT', { align: 'center' }).moveDown(0.5);
      doc.fontSize(18).text('Repair Completion Report', { align: 'center' }).moveDown(1);
      
      // Add a line separator
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#cccccc').moveDown(1);
      
      // Report details with better formatting
      doc.fontSize(14).text('REPAIR DETAILS', { align: 'center' }).moveDown(0.5);
      doc.fontSize(12);
      
      // Create a table-like layout
      const friendlyId = `REP-${data._id.toString().slice(-6).toUpperCase()}`;
      doc.text(`Repair ID: ${friendlyId}`, { continued: true }).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' }).moveDown(0.5);
      doc.text(`Customer: ${data.customerId?.username || ''}`, { continued: true }).text(`Email: ${data.customerId?.email || ''}`, { align: 'right' }).moveDown(0.5);
      
      if (data.assignedTechnician?.technicianId) {
        doc.text(`Technician: ${data.assignedTechnician.technicianId.username || ''}`, { continued: true }).text(`Email: ${data.assignedTechnician.technicianId.email || ''}`, { align: 'right' }).moveDown(0.5);
      } else {
        doc.text(`Technician: Not Assigned`).moveDown(0.5);
      }
      
      doc.moveDown(0.5);
      doc.text(`Damage Type: ${data.damageType}`).moveDown(0.3);
      doc.text(`Cost Estimate: Rs. ${data.costEstimate ?? '-'}`).moveDown(0.3);
      doc.text(`Time Estimate: ${data.timeEstimate ?? '-'} days`).moveDown(0.3);
      doc.text(`Status: ${data.status}`).moveDown(0.3);
      doc.text(`Progress: ${data.repairProgress || 0}%`).moveDown(0.3);
      if (data.currentStage) doc.text(`Current Stage: ${data.currentStage}`).moveDown(0.3);
      
      // Add footer
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#cccccc').moveDown(1);
      doc.fontSize(10).text('Thank you for choosing Cricket Expert for your equipment repair needs.', { align: 'center' });
      doc.text('For any queries, please contact us at support@cricketexpert.com', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Pipe directly to response
const pipeRepairReportToResponse = (res, data) => {
  try {
    console.log('Starting PDF generation for repair ID:', data._id);
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=repair_report_${data._id}.pdf`);

    doc.pipe(res);
    
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      res.status(500).json({ error: 'Failed to generate PDF' });
    });

  // Add logo with proper alignment
  try {
    const logoPath = path.join(process.cwd(), 'Frontend', 'src', 'assets', 'cricketexpert.png');
    // Center the logo horizontally and position it at the top
    const logoWidth = 80;
    const logoHeight = 40;
    const pageWidth = 612; // Standard PDF page width
    const logoX = (pageWidth - logoWidth) / 2; // Center horizontally
    doc.image(logoPath, logoX, 30, { width: logoWidth, height: logoHeight });
    console.log('Logo added to PDF with proper alignment');
  } catch (err) {
    console.log('Logo not found, continuing without logo:', err.message);
  }
  
  console.log('Generating PDF for repair ID:', data._id);

  // Header
  doc.fontSize(24).text('CRICKET EXPERT', { align: 'center' }).moveDown(0.5);
  doc.fontSize(18).text('Repair Completion Report', { align: 'center' }).moveDown(1);
  
  // Add a line separator
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#cccccc').moveDown(1);
  
  // Report details with better formatting
  doc.fontSize(14).text('REPAIR DETAILS', { align: 'center' }).moveDown(0.5);
  doc.fontSize(12);
  
  // Create a table-like layout
  const friendlyId = `REP-${data._id.toString().slice(-6).toUpperCase()}`;
  doc.text(`Repair ID: ${friendlyId}`, { continued: true }).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' }).moveDown(0.5);
  doc.text(`Customer: ${data.customerId?.username || ''}`, { continued: true }).text(`Email: ${data.customerId?.email || ''}`, { align: 'right' }).moveDown(0.5);
  
  if (data.assignedTechnician?.technicianId) {
    doc.text(`Technician: ${data.assignedTechnician.technicianId.username || ''}`, { continued: true }).text(`Email: ${data.assignedTechnician.technicianId.email || ''}`, { align: 'right' }).moveDown(0.5);
  } else {
    doc.text(`Technician: Not Assigned`).moveDown(0.5);
  }
  
  doc.moveDown(0.5);
  doc.text(`Damage Type: ${data.damageType}`).moveDown(0.3);
  doc.text(`Cost Estimate: Rs. ${data.costEstimate ?? '-'}`).moveDown(0.3);
  doc.text(`Time Estimate: ${data.timeEstimate ?? '-'} days`).moveDown(0.3);
  doc.text(`Status: ${data.status}`).moveDown(0.3);
  doc.text(`Progress: ${data.repairProgress || 0}%`).moveDown(0.3);
  if (data.currentStage) doc.text(`Current Stage: ${data.currentStage}`).moveDown(0.3);
  
  // Add footer
  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#cccccc').moveDown(1);
  doc.fontSize(10).text('Thank you for choosing Cricket Expert for your equipment repair needs.', { align: 'center' });
  doc.text('For any queries, please contact us at support@cricketexpert.com', { align: 'center' });

  doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Send report via email
const sendRepairReportEmail = async (data) => {
  const pdfBuffer = await generateRepairReportBuffer(data);

  await sendEmail(
    data.customerId.email,
    'Your Repair Completion Report',
    'Hello, please find your repair report attached.',
    pdfBuffer,
    `repair_report_${data._id}.pdf`
  );
};

export default {
  generateRepairReportBuffer,
  pipeRepairReportToResponse,
  sendRepairReportEmail
};
