import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate a professional certificate PDF
 * @param {Object} certificate - Certificate data
 * @returns {Buffer} PDF buffer
 */
export const generateCertificatePDF = async (certificate) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Set up fonts and colors
      const primaryColor = '#1a365d';
      const secondaryColor = '#2d3748';
      const accentColor = '#3182ce';

      // Background
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fill('#f8f9fa');

      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .stroke(primaryColor, 3);

      // Inner border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .stroke(accentColor, 1);

      // Header - Organization Name
      doc.fontSize(28)
         .fillColor(primaryColor)
         .text('CricketXpert Coaching Academy', doc.page.width / 2, 60, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Certificate Title
      doc.fontSize(24)
         .fillColor(secondaryColor)
         .text('CERTIFICATE OF COMPLETION', doc.page.width / 2, 120, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Decorative line
      doc.moveTo(doc.page.width / 2 - 100, 160)
         .lineTo(doc.page.width / 2 + 100, 160)
         .stroke(accentColor, 2);

      // This is to certify text
      doc.fontSize(16)
         .fillColor(secondaryColor)
         .text('This is to certify that', doc.page.width / 2, 200, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Student name
      const studentName = `${certificate.user.firstName} ${certificate.user.lastName}`;
      doc.fontSize(22)
         .fillColor(primaryColor)
         .text(studentName, doc.page.width / 2, 240, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Program completion text
      doc.fontSize(16)
         .fillColor(secondaryColor)
         .text(`has successfully completed the program`, doc.page.width / 2, 280, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Program name
      doc.fontSize(20)
         .fillColor(accentColor)
         .text(`"${certificate.program.title}"`, doc.page.width / 2, 320, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Completion details
      const completionDate = certificate.issueDate.toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
      });

      doc.fontSize(14)
         .fillColor(secondaryColor)
         .text(`Completed on: ${completionDate}`, doc.page.width / 2, 380, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Performance details
      const attendance = certificate.completionDetails.attendancePercentage;
      const grade = certificate.completionDetails.finalGrade;
      
      doc.fontSize(14)
         .fillColor(secondaryColor)
         .text(`Attendance: ${attendance}% | Final Grade: ${grade}`, doc.page.width / 2, 410, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Coach signature section
      const coachName = `${certificate.coach.userId.firstName} ${certificate.coach.userId.lastName}`;
      
      // Coach signature (right side)
      doc.fontSize(12)
         .fillColor(secondaryColor)
         .text('Coach Signature:', doc.page.width - 200, doc.page.height - 120, {
           width: 150
         });

      doc.fontSize(14)
         .fillColor(primaryColor)
         .text(coachName, doc.page.width - 200, doc.page.height - 100, {
           width: 150
         });

      // Certificate number
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .text(`Certificate No: ${certificate.certificateNumber}`, 50, doc.page.height - 80, {
           width: 200
         });

      // Verification info
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .text(`Verify at: ${certificate.verificationUrl}`, 50, doc.page.height - 60, {
           width: 300
         });

      // Footer
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .text('© 2024 CricketXpert Coaching Academy. All rights reserved.', doc.page.width / 2, doc.page.height - 30, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate a simple text-based certificate (fallback)
 * @param {Object} certificate - Certificate data
 * @returns {Buffer} PDF buffer
 */
export const generateSimpleCertificatePDF = async (certificate) => {
  const content = `
CERTIFICATE OF COMPLETION

This is to certify that
${certificate.user.firstName} ${certificate.user.lastName}

has successfully completed the program
"${certificate.program.title}"

Certificate Number: ${certificate.certificateNumber}
Issue Date: ${certificate.issueDate.toLocaleDateString()}
Attendance: ${certificate.completionDetails.attendancePercentage}%
Final Grade: ${certificate.completionDetails.finalGrade}

Coach: ${certificate.coach.userId.firstName} ${certificate.coach.userId.lastName}

This certificate is digitally verified and can be verified at:
${certificate.verificationUrl}

---
CricketXpert Coaching Academy
  `;

  return Buffer.from(content, 'utf8');
};
