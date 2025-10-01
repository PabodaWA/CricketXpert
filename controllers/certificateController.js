import Certificate from '../models/Certificate.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import CoachingProgram from '../models/CoachingProgram.js';
import Coach from '../models/Coach.js';
import mongoose from 'mongoose';
import { generateCertificatePDF } from '../utils/pdfGenerator.js';
import { sendCertificateEmail } from '../utils/wemailService.js';

// @desc    Check certificate eligibility for a user's enrollment
// @route   GET /api/certificates/eligibility/:enrollmentId
// @access  Private
const checkCertificateEligibility = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;

    // Get enrollment with populated data
    const enrollment = await ProgramEnrollment.findById(enrollmentId)
      .populate('user', 'firstName lastName email')
      .populate('program', 'title description totalSessions')
      .populate({
        path: 'program',
        populate: {
          path: 'coach',
          select: 'userId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        }
      });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user has access to this enrollment
    if (enrollment.user._id.toString() !== userId && req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this enrollment'
      });
    }

    // Get all sessions for this program where the user is a participant
    const sessions = await mongoose.model('Session').find({ 
      program: enrollment.program._id,
      'participants.user': enrollment.user._id
    }).select('_id scheduledDate participants');

    // Get attendance records for this user in this program
    const attendanceRecords = await Attendance.find({
      participant: enrollment.user._id,
      session: { $in: sessions.map(s => s._id) },
      attended: true
    });

    // Debug logs commented out to reduce terminal output
    // console.log('=== CERTIFICATE ELIGIBILITY DEBUG ===');
    // console.log('User ID:', enrollment.user._id);
    // console.log('Program ID:', enrollment.program._id);
    // console.log('Sessions found:', sessions.length);
    // console.log('Session IDs:', sessions.map(s => s._id));
    // console.log('Attendance records found:', attendanceRecords.length);
    // console.log('Attendance records:', attendanceRecords.map(ar => ({
    //   session: ar.session,
    //   participant: ar.participant,
    //   attended: ar.attended,
    //   status: ar.status
    // })));

    // Calculate attendance percentage - only count sessions where user is a participant
    const totalSessions = enrollment.program?.totalSessions || sessions.length;
    const attendedSessions = attendanceRecords.length;
    const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
    
    // console.log('Total sessions:', totalSessions);
    // console.log('Attended sessions:', attendedSessions);
    // console.log('Attendance percentage:', attendancePercentage);

    // Get progress percentage from enrollment
    const progressPercentage = enrollment.progress.progressPercentage || 0;

    // For certificate eligibility, use attendance percentage for both requirements
    // since attendance is the primary indicator of program completion
    const isEligible = attendancePercentage >= 75;
    const hasCertificate = enrollment.certificateIssued;

    // Get existing certificate if it exists - check both enrollment and direct lookup
    let existingCertificate = null;
    
    // First check if enrollment has certificate info
    if (hasCertificate && enrollment.certificateId) {
      existingCertificate = await Certificate.findById(enrollment.certificateId);
    }
    
    // If not found in enrollment, check directly by user and program
    if (!existingCertificate) {
      existingCertificate = await Certificate.findOne({
        user: enrollment.user._id,
        program: enrollment.program._id
      });
    }
    
    console.log('🔍 Certificate check result:', existingCertificate ? 'Found' : 'Not found');
    if (existingCertificate) {
      console.log('📜 Existing certificate:', {
        id: existingCertificate._id,
        certificateNumber: existingCertificate.certificateNumber,
        title: existingCertificate.title
      });
    }

    const responseData = {
      success: true,
      data: {
        enrollment: {
          id: enrollment._id,
          status: enrollment.status,
          progressPercentage,
          certificateEligible: enrollment.certificateEligible,
          certificateIssued: enrollment.certificateIssued
        },
        eligibility: {
          isEligible,
          attendancePercentage: Math.round(attendancePercentage),
          progressPercentage: Math.round(progressPercentage),
          totalSessions,
          attendedSessions,
          requirements: {
            attendanceRequired: 75,
            progressRequired: 75,
            attendanceMet: attendancePercentage >= 75,
            progressMet: attendancePercentage >= 75  // Use attendance for both requirements
          }
        },
        certificate: existingCertificate ? {
          id: existingCertificate._id,
          certificateNumber: existingCertificate.certificateNumber,
          issueDate: existingCertificate.issueDate,
          downloadCount: existingCertificate.downloadCount
        } : null
      }
    };

    // console.log('📤 Sending response to frontend:', {
    //   certificate: responseData.data.certificate ? 'Present' : 'Null',
    //   certificateId: responseData.data.certificate?.id,
    //   certificateNumber: responseData.data.certificate?.certificateNumber
    // });

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error checking certificate eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking certificate eligibility',
      error: error.message
    });
  }
};

// @desc    Generate certificate for eligible enrollment
// @route   POST /api/certificates/generate/:enrollmentId
// @access  Private
const generateCertificate = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;

    // Get enrollment with populated data
    const enrollment = await ProgramEnrollment.findById(enrollmentId)
      .populate('user', 'firstName lastName email')
      .populate('program', 'title description totalSessions')
      .populate({
        path: 'program',
        populate: {
          path: 'coach',
          select: 'userId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        }
      });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user has access to this enrollment
    if (enrollment.user._id.toString() !== userId && req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this enrollment'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      user: enrollment.user._id,
      program: enrollment.program._id
    });
    
    if (existingCertificate) {
      console.log('✅ Certificate already exists:', existingCertificate._id);
      return res.status(200).json({
        success: true,
        message: 'Certificate already exists',
        data: {
          certificate: existingCertificate,
          downloadUrl: `/api/certificates/download/${existingCertificate._id}`
        }
      });
    }

    // Check eligibility again - filter sessions by user participation
    const sessions = await mongoose.model('Session').find({ 
      program: enrollment.program._id,
      'participants.user': enrollment.user._id // Filter by user participation
    }).select('_id scheduledDate');

    // Debug logs commented out to reduce terminal output
    // console.log('=== CERTIFICATE GENERATION DEBUG ===');
    // console.log('User ID:', enrollment.user._id);
    // console.log('Program ID:', enrollment.program._id);
    // console.log('Sessions found:', sessions.length);
    // console.log('Session IDs:', sessions.map(s => s._id));

    const attendanceRecords = await Attendance.find({
      participant: enrollment.user._id,
      session: { $in: sessions.map(s => s._id) },
      attended: true
    });

    // console.log('Attendance records found:', attendanceRecords.length);
    // console.log('Attendance records:', attendanceRecords.map(ar => ({
    //   session: ar.session,
    //   participant: ar.participant,
    //   attended: ar.attended,
    //   status: ar.status
    // })));

    const totalSessions = enrollment.program?.totalSessions || sessions.length;
    const attendedSessions = attendanceRecords.length;
    const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
    const progressPercentage = enrollment.progress.progressPercentage || 0;

    // console.log('Total sessions:', totalSessions);
    // console.log('Attended sessions:', attendedSessions);
    // console.log('Attendance percentage:', attendancePercentage);
    // console.log('Progress percentage:', progressPercentage);

    if (attendancePercentage < 75) {
      console.log('❌ Certificate eligibility not met - attendance percentage too low');
      return res.status(400).json({
        success: false,
        message: 'Certificate eligibility requirements not met',
        data: {
          attendancePercentage: Math.round(attendancePercentage),
          progressPercentage: Math.round(progressPercentage),
          requirements: {
            attendanceRequired: 75,
            progressRequired: 75
          }
        }
      });
    }

    console.log('✅ Certificate eligibility met - proceeding with generation');
    
    // Debug enrollment data
    console.log('Enrollment data:', {
      user: enrollment.user,
      program: enrollment.program,
      coach: enrollment.program.coach
    });

    // Check if coach exists, use program coach or null
    let coachId = enrollment.program.coach?._id;
    if (!coachId) {
      console.warn('⚠️ Coach not found in program, setting to null');
      coachId = null; // Set to null instead of program ID
    }

    // Generate certificate number
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const certificateNumber = `CERT-${year}-${random}`;

    // Create certificate
    const certificateData = {
      user: enrollment.user._id,
      enrollment: enrollment._id,
      program: enrollment.program._id,
      coach: coachId,
      certificateNumber: certificateNumber,
      title: `Certificate of Completion - ${enrollment.program.title}`,
      description: `This certificate is awarded to ${enrollment.user.firstName} ${enrollment.user.lastName} for successfully completing the ${enrollment.program.title} program.`,
      completionDetails: {
        startDate: enrollment.enrollmentDate,
        endDate: new Date(),
        totalSessions,
        attendedSessions,
        attendancePercentage: Math.round(attendancePercentage),
        finalGrade: attendancePercentage >= 90 ? 'A+' : 
                   attendancePercentage >= 85 ? 'A' : 
                   attendancePercentage >= 80 ? 'A-' : 'Pass'
      },
      template: {
        layout: 'standard',
        backgroundColor: '#f8f9fa',
        textColor: '#212529'
      }
    };

    console.log('Creating certificate with data:', certificateData);
    
    let certificate;
    try {
      certificate = await Certificate.create(certificateData);
      console.log('Certificate created successfully:', certificate._id);

      // Update enrollment with certificate info
      enrollment.certificateEligible = true;
      enrollment.certificateIssued = true;
      enrollment.certificateId = certificate._id;
      await enrollment.save();
      console.log('Enrollment updated with certificate info');
    } catch (certificateError) {
      console.error('Error creating certificate:', certificateError);
      console.error('Certificate error details:', {
        name: certificateError.name,
        message: certificateError.message,
        stack: certificateError.stack
      });
      return res.status(500).json({
        success: false,
        message: 'Error creating certificate',
        error: certificateError.message,
        details: certificateError.name
      });
    }

    // Send certificate email to user
    try {
      const emailResult = await sendCertificateEmail(
        enrollment.user.email,
        `${enrollment.user.firstName} ${enrollment.user.lastName}`,
        enrollment.program.title,
        certificate.certificateNumber
      );
      
      if (emailResult.success) {
        console.log('Certificate email sent successfully');
      } else {
        console.warn('Failed to send certificate email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending certificate email:', emailError);
      // Don't fail the certificate generation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully and email sent',
      data: {
        certificate,
        downloadUrl: `/api/certificates/download/${certificate._id}`
      }
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificate',
      error: error.message
    });
  }
};

// @desc    Download certificate PDF
// @route   GET /api/certificates/download/:certificateId
// @access  Private
const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    // Get certificate with populated data
    const certificate = await Certificate.findById(certificateId)
      .populate('user', 'firstName lastName email')
      .populate('program', 'title description')
      .populate({
        path: 'coach',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .populate('enrollment');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check if user has access to this certificate
    if (certificate.user._id.toString() !== userId && req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this certificate'
      });
    }

    // Increment download count
    await certificate.incrementDownload();

    // Generate PDF (we'll implement this next)
    const pdfBuffer = await generateCertificatePDF(certificate);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading certificate',
      error: error.message
    });
  }
};

// @desc    Get user's certificates
// @route   GET /api/certificates/user/:userId
// @access  Private
const getUserCertificates = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Check authorization
    if (userId !== currentUserId && req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these certificates'
      });
    }

    const certificates = await Certificate.find({ user: userId })
      .populate('program', 'title description')
      .populate('enrollment', 'status progress')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificates',
      error: error.message
    });
  }
};

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:certificateNumber
// @access  Public
const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const result = await Certificate.verifyCertificate(certificateNumber);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate',
      error: error.message
    });
  }
};

// @desc    Check existing certificates - DEBUG ONLY
// @route   GET /api/certificates/check/:enrollmentId
// @access  Public
const checkExistingCertificates = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    console.log('🔍 CHECKING EXISTING CERTIFICATES FOR:', enrollmentId);
    
    // Get enrollment
    const enrollment = await ProgramEnrollment.findById(enrollmentId)
      .populate('user', 'firstName lastName email')
      .populate('program', 'title description totalSessions');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check for existing certificates
    const existingCertificates = await Certificate.find({
      user: enrollment.user._id,
      program: enrollment.program._id
    });

    console.log('🔍 Found certificates:', existingCertificates.length);
    console.log('🔍 Certificates:', existingCertificates.map(c => ({
      id: c._id,
      certificateNumber: c.certificateNumber,
      title: c.title
    })));

    res.status(200).json({
      success: true,
      message: 'Certificate check completed',
      data: {
        enrollment: {
          id: enrollment._id,
          user: enrollment.user.firstName,
          program: enrollment.program.title
        },
        certificates: existingCertificates.map(c => ({
          id: c._id,
          certificateNumber: c.certificateNumber,
          title: c.title,
          issueDate: c.issueDate
        }))
      }
    });

  } catch (error) {
    console.error('❌ Check certificates failed:', error);
    res.status(500).json({
      success: false,
      message: 'Check certificates failed',
      error: error.message
    });
  }
};

// @desc    Test certificate generation - DEBUG ONLY
// @route   GET /api/certificates/test/:enrollmentId
// @access  Public
const testCertificateGeneration = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    console.log('🧪 TESTING CERTIFICATE GENERATION FOR:', enrollmentId);
    
    // Get enrollment
    const enrollment = await ProgramEnrollment.findById(enrollmentId)
      .populate('user', 'firstName lastName email')
      .populate('program', 'title description totalSessions')
      .populate({
        path: 'program',
        populate: {
          path: 'coach',
          select: 'userId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        }
      });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    console.log('✅ Enrollment found:', {
      user: enrollment.user?.firstName,
      program: enrollment.program?.title,
      coach: enrollment.program?.coach
    });

    // Test certificate data
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const certificateNumber = `CERT-${year}-${random}`;
    
    const testData = {
      user: enrollment.user._id,
      enrollment: enrollment._id,
      program: enrollment.program._id,
      coach: enrollment.program.coach?._id || null,
      certificateNumber: certificateNumber,
      title: `Test Certificate - ${enrollment.program.title}`,
      description: `Test certificate for ${enrollment.user.firstName}`,
      completionDetails: {
        startDate: enrollment.enrollmentDate,
        endDate: new Date(),
        totalSessions: 1,
        attendedSessions: 1,
        attendancePercentage: 100,
        finalGrade: 'Pass'
      }
    };

    console.log('🧪 Test certificate data:', testData);

    // Try to create certificate
    const certificate = await Certificate.create(testData);
    console.log('✅ Certificate created successfully:', certificate._id);

    res.status(200).json({
      success: true,
      message: 'Test certificate created successfully',
      certificateId: certificate._id
    });

  } catch (error) {
    console.error('❌ Test certificate generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test certificate generation failed',
      error: error.message,
      stack: error.stack
    });
  }
};

export {
  checkCertificateEligibility,
  generateCertificate,
  downloadCertificate,
  getUserCertificates,
  verifyCertificate,
  testCertificateGeneration,
  checkExistingCertificates
};
