import PDFDocument from 'pdfkit';

/**
 * Generate a professional session details PDF
 * @param {Object} session - Session data
 * @param {Object} enrollment - Enrollment data
 * @param {Object} user - User data
 * @returns {Buffer} PDF buffer
 */
export const generateSessionDetailsPDF = async (session, enrollment, user) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
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
      const successColor = '#38a169';
      const warningColor = '#d69e2e';
      const dangerColor = '#e53e3e';

      // Header
      doc.fontSize(24)
         .fillColor(primaryColor)
         .text('Session Details Report', 50, 50, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Organization name
      doc.fontSize(14)
         .fillColor(secondaryColor)
         .text('CricketXpert Coaching Academy', 50, 80, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Date generated
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .text(`Generated on: ${new Date().toLocaleDateString('en-US', {
           weekday: 'long',
           year: 'numeric',
           month: 'long',
           day: 'numeric'
         })}`, 50, 100, {
           align: 'center',
           width: doc.page.width - 100
         });

      let currentY = 140;

      // Session Information Section
      doc.fontSize(16)
         .fillColor(primaryColor)
         .text('Session Information', 50, currentY);
      
      currentY += 30;

      // Session details in a structured format
      const sessionInfo = [
        { label: 'Session Number', value: `Session ${session.sessionNumber || 'N/A'}` },
        { label: 'Status', value: session.status || 'N/A' },
        { label: 'Date', value: session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'Date TBD' },
        { label: 'Time', value: session.startTime || session.scheduledTime || 'Time TBD' },
        { label: 'Duration', value: `${session.duration || 120} minutes` },
        { label: 'Week', value: `Week ${session.week || session.sessionNumber || 'N/A'}` }
      ];

      sessionInfo.forEach((info, index) => {
        doc.fontSize(12)
           .fillColor(secondaryColor)
           .text(`${info.label}:`, 60, currentY);
        
        doc.fontSize(12)
           .fillColor(primaryColor)
           .text(info.value, 200, currentY);
        
        currentY += 20;
      });

      currentY += 20;

      // Ground Information Section (if available)
      if (session.ground) {
        doc.fontSize(16)
           .fillColor(primaryColor)
           .text('Ground Information', 50, currentY);
        
        currentY += 30;

        const groundInfo = [
          { label: 'Ground Name', value: session.ground.name || 'N/A' },
          { label: 'Location', value: session.ground.location || 'N/A' },
          { label: 'Ground Slot', value: `Slot ${session.groundSlot || 'N/A'}` }
        ];

        if (session.ground.facilities) {
          groundInfo.push({ 
            label: 'Facilities', 
            value: session.ground.facilities.join(', ') 
          });
        }

        groundInfo.forEach((info) => {
          doc.fontSize(12)
             .fillColor(secondaryColor)
             .text(`${info.label}:`, 60, currentY);
          
          doc.fontSize(12)
             .fillColor(primaryColor)
             .text(info.value, 200, currentY);
          
          currentY += 20;
        });

        currentY += 20;
      }

      // Reschedule Information Section (if rescheduled)
      if (session.rescheduled) {
        doc.fontSize(16)
           .fillColor(warningColor)
           .text('Reschedule Information', 50, currentY);
        
        currentY += 30;

        doc.fontSize(12)
           .fillColor(secondaryColor)
           .text('Rescheduled on:', 60, currentY);
        
        doc.fontSize(12)
           .fillColor(primaryColor)
           .text(session.rescheduledAt ? new Date(session.rescheduledAt).toLocaleDateString() : 'Unknown', 200, currentY);
        
        currentY += 20;

        if (session.rescheduledFrom) {
          doc.fontSize(12)
             .fillColor(secondaryColor)
             .text('Previous Schedule:', 60, currentY);
          
          currentY += 20;

          doc.fontSize(11)
             .fillColor(secondaryColor)
             .text(`Date: ${new Date(session.rescheduledFrom.date).toLocaleDateString()}`, 80, currentY);
          
          currentY += 15;

          if (session.rescheduledFrom.time) {
            doc.fontSize(11)
               .fillColor(secondaryColor)
               .text(`Time: ${session.rescheduledFrom.time}`, 80, currentY);
            
            currentY += 15;
          }

          doc.fontSize(11)
             .fillColor(secondaryColor)
             .text(`Ground Slot: ${session.rescheduledFrom.groundSlot}`, 80, currentY);
          
          currentY += 20;
        }

        currentY += 20;
      }

      // Session Notes Section (if available)
      if (session.notes) {
        doc.fontSize(16)
           .fillColor(primaryColor)
           .text('Session Notes', 50, currentY);
        
        currentY += 30;

        doc.fontSize(12)
           .fillColor(secondaryColor)
           .text(session.notes, 60, currentY, {
             width: doc.page.width - 120
           });
        
        currentY += 40;
      }

      // Attendance Information Section
      if (session.participants && session.participants.length > 0) {
        doc.fontSize(16)
           .fillColor(primaryColor)
           .text('Attendance Information', 50, currentY);
        
        currentY += 30;

        const participant = session.participants.find(p => 
          p.user && p.user._id === user._id
        );

        if (participant) {
          const attendanceStatus = participant.attendanceStatus;
          const userAttendance = participant.attendance || (participant.attended !== undefined ? {
            attended: participant.attended,
            status: participant.attended ? 'present' : 'absent',
            attendanceMarkedAt: participant.attendanceMarkedAt,
            performance: participant.performance,
            remarks: participant.remarks
          } : null);

          if (attendanceStatus === 'present' || attendanceStatus === 'absent') {
            doc.fontSize(12)
               .fillColor(secondaryColor)
               .text('Status:', 60, currentY);
            
            doc.fontSize(12)
               .fillColor(attendanceStatus === 'present' ? successColor : dangerColor)
               .text(attendanceStatus === 'present' ? 'Present' : 'Absent', 200, currentY);
            
            currentY += 20;

            if (userAttendance.attendanceMarkedAt) {
              doc.fontSize(12)
                 .fillColor(secondaryColor)
                 .text('Marked On:', 60, currentY);
              
              doc.fontSize(12)
                 .fillColor(primaryColor)
                 .text(new Date(userAttendance.attendanceMarkedAt).toLocaleString(), 200, currentY);
              
              currentY += 20;
            }

            if (userAttendance.performance) {
              doc.fontSize(12)
                 .fillColor(secondaryColor)
                 .text('Performance Rating:', 60, currentY);
              
              doc.fontSize(12)
                 .fillColor(primaryColor)
                 .text(`${userAttendance.performance.rating}/5`, 200, currentY);
              
              currentY += 20;

              if (userAttendance.performance.notes) {
                doc.fontSize(12)
                   .fillColor(secondaryColor)
                   .text('Performance Notes:', 60, currentY);
                
                currentY += 20;

                doc.fontSize(11)
                   .fillColor(primaryColor)
                   .text(userAttendance.performance.notes, 80, currentY, {
                     width: doc.page.width - 140
                   });
                
                currentY += 30;
              }
            }

            if (userAttendance.remarks) {
              doc.fontSize(12)
                 .fillColor(secondaryColor)
                 .text('Coach Remarks:', 60, currentY);
              
              currentY += 20;

              doc.fontSize(11)
                 .fillColor(primaryColor)
                 .text(userAttendance.remarks, 80, currentY, {
                   width: doc.page.width - 140
                 });
              
              currentY += 30;
            }
          } else if (attendanceStatus === 'not_marked') {
            doc.fontSize(12)
               .fillColor(secondaryColor)
               .text('Status:', 60, currentY);
            
            doc.fontSize(12)
               .fillColor(warningColor)
               .text('Not Marked', 200, currentY);
            
            currentY += 20;

            doc.fontSize(11)
               .fillColor(secondaryColor)
               .text('Coach has not marked attendance for this session yet.', 60, currentY);
            
            currentY += 30;
          }
        }

        currentY += 20;
      }

      // Get coach name from the populated coach data (moved outside sections)
      let coachName = 'N/A';
      
      // Try to get coach name from enrollment program
      if (enrollment && enrollment.program && enrollment.program.coach && enrollment.program.coach.userId) {
        const coachUser = enrollment.program.coach.userId;
        coachName = `${coachUser.firstName || ''} ${coachUser.lastName || ''}`.trim() || 'N/A';
      }
      // Fallback: try to get coach name from session program
      else if (session.program && session.program.coach && session.program.coach.userId) {
        const coachUser = session.program.coach.userId;
        coachName = `${coachUser.firstName || ''} ${coachUser.lastName || ''}`.trim() || 'N/A';
      }

      // Program Information Section
      if (enrollment && enrollment.program) {
        doc.fontSize(16)
           .fillColor(primaryColor)
           .text('Program Information', 50, currentY);
        
        currentY += 30;

        const programInfo = [
          { label: 'Program Name', value: enrollment.program.title || 'N/A' },
          { label: 'Coach', value: coachName },
          { label: 'Enrollment Date', value: enrollment.enrollmentDate ? 
            new Date(enrollment.enrollmentDate).toLocaleDateString() : 'N/A' }
        ];

        programInfo.forEach((info) => {
          doc.fontSize(12)
             .fillColor(secondaryColor)
             .text(`${info.label}:`, 60, currentY);
          
          doc.fontSize(12)
             .fillColor(primaryColor)
             .text(info.value, 200, currentY);
          
          currentY += 20;
        });

        currentY += 20;
      }


      // Footer
      const footerY = doc.page.height - 80;
      
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .text('© 2024 CricketXpert Coaching Academy. All rights reserved.', 50, footerY, {
           align: 'center',
           width: doc.page.width - 100
         });

      // Session ID for reference
      doc.fontSize(8)
         .fillColor(secondaryColor)
         .text(`Session ID: ${session._id}`, 50, footerY + 20);

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};
