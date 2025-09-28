import Certificate from '../models/Certificate.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import CoachingProgram from '../models/CoachingProgram.js';
import Coach from '../models/Coach.js';
import mongoose from 'mongoose';
import { generateCertificatePDF } from '../utils/pdfGenerator.js';

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

    // Get all sessions for this program
    const sessions = await mongoose.model('Session').find({ 
      program: enrollment.program._id 
    }).select('_id scheduledDate');

    // Get attendance records for this user in this program
    const attendanceRecords = await Attendance.find({
      participant: enrollment.user._id,
      session: { $in: sessions.map(s => s._id) },
      attended: true
    });

    // Calculate attendance percentage
    const totalSessions = sessions.length;
    const attendedSessions = attendanceRecords.length;
    const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

    // Get progress percentage from enrollment
    const progressPercentage = enrollment.progress.progressPercentage || 0;

    // Check eligibility conditions
    const isEligible = attendancePercentage >= 75 && progressPercentage >= 75;
    const hasCertificate = enrollment.certificateIssued;

    // Get existing certificate if it exists
    let existingCertificate = null;
    if (hasCertificate && enrollment.certificateId) {
      existingCertificate = await Certificate.findById(enrollment.certificateId);
    }

    res.status(200).json({
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
            progressMet: progressPercentage >= 75
          }
        },
        certificate: existingCertificate ? {
          id: existingCertificate._id,
          certificateNumber: existingCertificate.certificateNumber,
          issueDate: existingCertificate.issueDate,
          downloadCount: existingCertificate.downloadCount
        } : null
      }
    });
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
    if (enrollment.certificateIssued && enrollment.certificateId) {
      const existingCertificate = await Certificate.findById(enrollment.certificateId);
      if (existingCertificate) {
        return res.status(200).json({
          success: true,
          message: 'Certificate already exists',
          data: {
            certificate: existingCertificate,
            downloadUrl: `/api/certificates/download/${existingCertificate._id}`
          }
        });
      }
    }

    // Check eligibility again
    const sessions = await mongoose.model('Session').find({ 
      program: enrollment.program._id 
    }).select('_id scheduledDate');

    const attendanceRecords = await Attendance.find({
      participant: enrollment.user._id,
      session: { $in: sessions.map(s => s._id) },
      attended: true
    });

    const totalSessions = sessions.length;
    const attendedSessions = attendanceRecords.length;
    const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
    const progressPercentage = enrollment.progress.progressPercentage || 0;

    if (attendancePercentage < 75 || progressPercentage < 75) {
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

    // Create certificate
    const certificateData = {
      user: enrollment.user._id,
      enrollment: enrollment._id,
      program: enrollment.program._id,
      coach: enrollment.program.coach._id,
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

    const certificate = await Certificate.create(certificateData);

    // Update enrollment with certificate info
    enrollment.certificateEligible = true;
    enrollment.certificateIssued = true;
    enrollment.certificateId = certificate._id;
    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
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

export {
  checkCertificateEligibility,
  generateCertificate,
  downloadCertificate,
  getUserCertificates,
  verifyCertificate
};
