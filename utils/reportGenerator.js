const PDFDocument = require('pdfkit');
const { sendEmail } = require('./notification'); // email function

// Generates PDF and pipes to response, and returns buffer to send via email
exports.generateRepairReportBuffer = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      doc.fontSize(18).text('Repair Completion Report', { align: 'center' }).moveDown();
      doc.fontSize(12).text(`Repair ID: ${data._id}`);
      doc.text(`Customer: ${data.customerId?.username || ''} (${data.customerId?.email || ''})`);
      if (data.assignedTechnician?.technicianId) {
        doc.text(`Technician: ${data.assignedTechnician.technicianId.username || ''} (${data.assignedTechnician.technicianId.email || ''})`);
      } else {
        doc.text(`Technician: -`);
      }
      doc.text(`Damage Type: ${data.damageType}`);
      doc.text(`Cost Estimate: ${data.costEstimate ?? '-'}`);
      doc.text(`Time Estimate: ${data.timeEstimate ?? '-'}`);
      doc.text(`Status: ${data.status}`);
      doc.text(`Progress: ${data.repairProgress || 0}%`);
      if (data.currentStage) doc.text(`Current Stage: ${data.currentStage}`);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Pipe directly to response
exports.pipeRepairReportToResponse = (res, data) => {
  const doc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=repair_report_${data._id}.pdf`);

  doc.pipe(res);

  doc.fontSize(18).text('Repair Completion Report', { align: 'center' }).moveDown();
  doc.fontSize(12).text(`Repair ID: ${data._id}`);
  doc.text(`Customer: ${data.customerId?.username || ''} (${data.customerId?.email || ''})`);
  if (data.assignedTechnician?.technicianId) {
    doc.text(`Technician: ${data.assignedTechnician.technicianId.username || ''} (${data.assignedTechnician.technicianId.email || ''})`);
  } else {
    doc.text(`Technician: -`);
  }
  doc.text(`Damage Type: ${data.damageType}`);
  doc.text(`Cost Estimate: ${data.costEstimate ?? '-'}`);
  doc.text(`Time Estimate: ${data.timeEstimate ?? '-'}`);
  doc.text(`Status: ${data.status}`);
  doc.text(`Progress: ${data.repairProgress || 0}%`);
  if (data.currentStage) doc.text(`Current Stage: ${data.currentStage}`);

  doc.end();
};

// Send report via email
exports.sendRepairReportEmail = async (data) => {
  const pdfBuffer = await exports.generateRepairReportBuffer(data);

  await sendEmail(
    data.customerId.email,
    'Your Repair Completion Report',
    'Hello, please find your repair report attached.',
    pdfBuffer,
    `repair_report_${data._id}.pdf`
  );
};
