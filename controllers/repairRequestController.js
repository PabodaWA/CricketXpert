import RepairRequest from '../models/RepairRequest.js';
import Technician from '../models/Technician.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/notification.js';
import reportGenerator from '../utils/reportGenerator.js';
import repairNotificationController from './repairNotificationController.js';
const { pipeRepairReportToResponse, sendRepairReportEmail } = reportGenerator;


/**
 * 1️ Create a new Repair Request (Customer)
 * - Customer submits a repair request with damage details.
 * - Status is set to 'Pending'.
 * - Service Manager is notified via email.
 */
const createRepairRequest = async (req, res) => {
  try {
    const { customerId, equipmentType, damageType, description } = req.body;
    
    // Debug: Log what we received
    console.log('🔍 BACKEND RECEIVED REQ.BODY:', req.body);
    console.log('🔍 BACKEND RECEIVED DESCRIPTION:', description);
    console.log('🔍 BACKEND DESCRIPTION TYPE:', typeof description);
    console.log('🔍 BACKEND DESCRIPTION LENGTH:', description?.length);


    if (!customerId || !damageType)
      return res.status(400).json({ error: 'customerId and damageType are required' });

    // Ensure we have valid data - preserve customer's actual description
    const repairData = {
      customerId,
      equipmentType: equipmentType || 'cricket_bat', // Default value if empty
      damageType,
      description: description || '', // Keep customer's description exactly as they typed it - NO FALLBACK
      status: 'Pending',
      repairProgress: 0,
      currentStage: 'Request Submitted'
    };

    // Force the description to be exactly what the customer provided
    if (description !== undefined && description !== null) {
      repairData.description = String(description);
    } else {
      repairData.description = '';
    }

    // Temporary debug to see what we're saving
    console.log('🔍 SAVING TO DATABASE:', repairData);
    console.log('🔍 DESCRIPTION BEING SAVED:', repairData.description);
    console.log('🔍 DESCRIPTION TYPE:', typeof repairData.description);
    console.log('🔍 DESCRIPTION LENGTH:', repairData.description?.length);
    
    const repairRequest = await RepairRequest.create(repairData);
    
    // Create repair submission notification
    try {
      await repairNotificationController.createRepairSubmissionNotification(
        customerId,
        repairRequest._id,
        repairData
      );
      console.log('✅ Repair submission notification created successfully');
    } catch (notificationError) {
      console.error('❌ Failed to create repair submission notification:', notificationError);
      // Don't fail the repair request creation if notification fails
    }
    
    // Temporary debug to see what was saved
    console.log('🔍 SAVED TO DATABASE:', {
      id: repairRequest._id,
      description: repairRequest.description,
      damageType: repairRequest.damageType
    });
    console.log('🔍 SAVED DESCRIPTION:', repairRequest.description);
    console.log('🔍 SAVED DESCRIPTION TYPE:', typeof repairRequest.description);
    console.log('🔍 SAVED DESCRIPTION LENGTH:', repairRequest.description?.length);
    
    // Debug: Check if description was actually saved
    const savedRequest = await RepairRequest.findById(repairRequest._id);
    console.log('🔍 VERIFICATION - SAVED REQUEST DESCRIPTION:', savedRequest.description);
    console.log('🔍 VERIFICATION - SAVED REQUEST DESCRIPTION TYPE:', typeof savedRequest.description);
    
    // Get customer details for comprehensive email
    const customer = await User.findById(customerId);
    
    //Notify Service Manager with comprehensive details
    if (process.env.SERVICE_MANAGER_EMAIL) {
      console.log('📧 SENDING ENHANCED EMAIL TO SERVICE MANAGER');
      const emailSubject = `🔧 New Repair Request Submitted - ${customer?.username || 'Unknown Customer'}`;
      
      const emailBody = `
🏢 CRICKETXPERT REPAIR SERVICE
═══════════════════════════════════════════════════════════════

📋 REPAIR REQUEST DETAILS
───────────────────────────────────────────────────────────────
Request ID: REP-${repairRequest._id.toString().slice(-8).toUpperCase()}
Submission Date: ${new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
Status: ${repairRequest.status}
Current Stage: ${repairRequest.currentStage}

👤 CUSTOMER INFORMATION
───────────────────────────────────────────────────────────────
Customer ID: CUST-${customerId.toString().slice(-6).toUpperCase()}
Full Name: ${customer?.firstName || ''} ${customer?.lastName || ''}
Username: ${customer?.username || 'N/A'}
Email: ${customer?.email || 'N/A'}
Phone: ${customer?.contactNumber || 'N/A'}
Address: ${customer?.address || 'N/A'}

🔧 EQUIPMENT & DAMAGE DETAILS
───────────────────────────────────────────────────────────────
Equipment Type: ${equipmentType ? equipmentType.replace('_', ' ').toUpperCase() : 'Not Specified'}
Damage Type: ${damageType}
Description: ${description || 'No description provided'}

📊 REQUEST SUMMARY
───────────────────────────────────────────────────────────────
This repair request has been automatically assigned a Pending status and 
is ready for your review and technician assignment.

Next Steps:
1. Review the damage details and customer information
2. Assign an appropriate technician based on equipment type
3. Provide cost and time estimates to the customer

═══════════════════════════════════════════════════════════════
This is an automated notification from the CricketXpert Repair System.
Please do not reply to this email.

For system support, contact: ${process.env.EMAIL_USER || 'support@cricketxpert.com'}
      `.trim();

      await sendEmail(
        process.env.SERVICE_MANAGER_EMAIL,
        emailSubject,
        emailBody
      );
    }

    // Send confirmation email to customer
    if (customer?.email) {
      console.log('📧 SENDING CONFIRMATION EMAIL TO CUSTOMER');
      const customerEmailSubject = `✅ Repair Request Confirmation - REP-${repairRequest._id.toString().slice(-8).toUpperCase()}`;
      
      const customerEmailBody = `
🏢 CRICKETXPERT REPAIR SERVICE
═══════════════════════════════════════════════════════════════

Dear ${customer?.firstName || customer?.username || 'Valued Customer'},

Thank you for choosing CricketXpert for your equipment repair needs. 
Your repair request has been successfully submitted and is now under review.

📋 YOUR REPAIR REQUEST DETAILS
───────────────────────────────────────────────────────────────
Request ID: REP-${repairRequest._id.toString().slice(-8).toUpperCase()}
Customer ID: CUST-${customerId.toString().slice(-6).toUpperCase()}
Submission Date: ${new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
Status: ${repairRequest.status}
Current Stage: ${repairRequest.currentStage}

🔧 EQUIPMENT & DAMAGE INFORMATION
───────────────────────────────────────────────────────────────
Equipment Type: ${equipmentType ? equipmentType.replace('_', ' ').toUpperCase() : 'Not Specified'}
Damage Type: ${damageType}
Description: ${description || 'No description provided'}

📞 WHAT HAPPENS NEXT?
───────────────────────────────────────────────────────────────
1. Our service manager will review your request within 24 hours
2. You will receive an email with cost and time estimates
3. Once approved, a qualified technician will be assigned
4. You'll receive regular updates on repair progress
5. You'll be notified when your equipment is ready for pickup

💡 IMPORTANT NOTES
───────────────────────────────────────────────────────────────
• Keep this email as your reference for Request ID: REP-${repairRequest._id.toString().slice(-8).toUpperCase()}
• You can track your repair progress in your customer dashboard
• For any questions, please contact us with your Request ID
• Estimated review time: 24-48 hours

📧 CONTACT INFORMATION
───────────────────────────────────────────────────────────────
Email: ${process.env.EMAIL_USER || 'support@cricketxpert.com'}
Phone: [Your Contact Number]
Website: [Your Website]

Thank you for trusting CricketXpert with your equipment repair needs!

Best regards,
CricketXpert Repair Team

═══════════════════════════════════════════════════════════════
This is an automated confirmation email. Please do not reply to this email.
      `.trim();

      await sendEmail(
        customer.email,
        customerEmailSubject,
        customerEmailBody
      );
    }

    res.status(201).json({ message: 'Repair request created', repairRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Test function to verify data saving
const testRepairRequest = async (req, res) => {
  try {
    const testData = {
      customerId: req.body.customerId || '507f1f77bcf86cd799439011', // Default test ID
      equipmentType: 'cricket_bat',
      damageType: 'Bat Handle Damage',
      description: 'Test description for equipment repair',
      status: 'Pending',
      repairProgress: 0,
      currentStage: 'Request Submitted'
    };

    const repairRequest = await RepairRequest.create(testData);
    res.json({ message: 'Test repair request created successfully', repairRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Debug function to check what's in the database
const debugRepairRequests = async (req, res) => {
  try {
    const requests = await RepairRequest.find().sort({ createdAt: -1 }).limit(5);
    const debugInfo = requests.map(request => ({
      id: request._id,
      customerId: request.customerId,
      equipmentType: request.equipmentType,
      damageType: request.damageType,
      description: request.description,
      createdAt: request.createdAt
    }));
    res.json({ message: 'Debug info', requests: debugInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Test function to create and immediately retrieve a repair request
const testDescriptionFlow = async (req, res) => {
  try {
    const testDescription = 'TEST DESCRIPTION: My bat handle is completely broken and needs immediate repair';
    
    // Create a test repair request
    const testData = {
      customerId: req.body.customerId || '507f1f77bcf86cd799439011',
      equipmentType: 'cricket_bat',
      damageType: 'Bat Handle Damage',
      description: testDescription,
      status: 'Pending'
    };
    
    console.log('🔍 CREATING TEST REQUEST WITH DESCRIPTION:', testDescription);
    const createdRequest = await RepairRequest.create(testData);
    console.log('🔍 CREATED REQUEST DESCRIPTION:', createdRequest.description);
    
    // Immediately retrieve it
    const retrievedRequest = await RepairRequest.findById(createdRequest._id);
    console.log('🔍 RETRIEVED REQUEST DESCRIPTION:', retrievedRequest.description);
    
    res.json({
      message: 'Test completed',
      created: {
        id: createdRequest._id,
        description: createdRequest.description
      },
      retrieved: {
        id: retrievedRequest._id,
        description: retrievedRequest.description
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Simple test to verify description handling
const testDescriptionSimple = async (req, res) => {
  try {
    const { description } = req.body;
    console.log('🔍 SIMPLE TEST - Received description:', description);
    
    const testData = {
      customerId: '507f1f77bcf86cd799439011',
      equipmentType: 'cricket_bat',
      damageType: 'Bat Handle Damage',
      description: description,
      status: 'Pending'
    };
    
    const createdRequest = await RepairRequest.create(testData);
    console.log('🔍 SIMPLE TEST - Created description:', createdRequest.description);
    
    res.json({
      message: 'Simple test completed',
      received: description,
      saved: createdRequest.description,
      match: description === createdRequest.description
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Direct test to check what's in the database
const checkDatabaseDescription = async (req, res) => {
  try {
    const requests = await RepairRequest.find().sort({ createdAt: -1 }).limit(3);
    const descriptions = requests.map(request => ({
      id: request._id,
      description: request.description,
      damageType: request.damageType,
      createdAt: request.createdAt
    }));
    
    res.json({
      message: 'Database check completed',
      requests: descriptions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 2️ Update Repair Request (General)
 * - Allows updating general fields of a repair request.
 * - Service Manager is notified of any changes.
 */
const updateRepairGeneral = async (req, res) => {
  try {
    const request = await RepairRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!request) return res.status(404).json({ error: 'Repair request not found' });

    if (process.env.SERVICE_MANAGER_EMAIL) {
      console.log('📧 SENDING UPDATED REPAIR REQUEST EMAIL WITH NEW FORMAT');
      await sendEmail(
        process.env.SERVICE_MANAGER_EMAIL,
        `Repair Request Updated - REP-${request._id.toString().slice(-8).toUpperCase()}`,
        `Repair request has been updated.\n\nRequest ID: REP-${request._id.toString().slice(-8).toUpperCase()}\nCustomer ID: CUST-${request.customerId.toString().slice(-6).toUpperCase()}\nDamage Type: ${request.damageType}\nStatus: ${request.status}`
      );
    }

    res.json({ message: 'Repair request updated', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 3️ Get All Repair Requests (Service Manager)
 * - Returns all repair requests.
 * - Populates customer and assigned technician details.
 */
const getAllRepairRequests = async (req, res) => {
  try {
    const requests = await RepairRequest.find()
      .populate('customerId', 'username email')
      .populate({ path: 'assignedTechnician', populate: { path: 'technicianId', select: 'username email' } })
      .sort({ createdAt: -1 }); // Sort by creation date, newest first
    
    // Return requests exactly as they are in the database - NO MODIFICATIONS
    const fixedRequests = requests.map(request => request.toObject());
    
    res.json(fixedRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 4️ Get Repair Request By ID
 * - Returns a single repair request by ID.
 * - Populates customer and assigned technician details.
 */
const getRepairRequestById = async (req, res) => {
  try {
    const request = await RepairRequest.findById(req.params.id)
      .populate('customerId', 'username email')
      .populate({ path: 'assignedTechnician', populate: { path: 'technicianId', select: 'username email' } });
    if (!request) return res.status(404).json({ error: 'Repair request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 5️ Update Request Status (Service Manager Approve / Reject)
 * - Service Manager can approve or reject repair requests.
 * - If approved: cost and time estimates can be added.
 * - Status and current stage are updated accordingly.
 * - Customer receives email notification.
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, costEstimate, timeEstimate, rejectionReason } = req.body;

    const request = await RepairRequest.findById(id).populate('customerId', 'email username');
    if (!request) return res.status(404).json({ error: 'Repair request not found' });

    request.status = status;

    if (status.toLowerCase() === 'approved') {
   // Only set cost and time if approved
      if (costEstimate !== undefined) request.costEstimate = costEstimate;
      if (timeEstimate !== undefined) request.timeEstimate = timeEstimate;
      request.currentStage = 'Waiting for Customer Approval';
    } else if (status.toLowerCase() === 'rejected') {
      if (rejectionReason) request.rejectionReason = rejectionReason;
      request.currentStage = 'Request Rejected';
    }

    await request.save();

    // Create repair status notification
    try {
      await repairNotificationController.createRepairStatusNotification(
        request.customerId._id,
        request._id,
        status,
        {
          equipmentType: request.equipmentType,
          damageType: request.damageType,
          status: request.status,
          repairProgress: request.repairProgress,
          costEstimate: request.costEstimate,
          timeEstimate: request.timeEstimate,
          rejectionReason: request.rejectionReason
        }
      );
      console.log('✅ Repair status notification created successfully');
    } catch (notificationError) {
      console.error('❌ Failed to create repair status notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    // Send email to customer
    let emailBody = `Hello ${request.customerId.username},\n\nYour repair request status has been updated.\n\nRequest ID: REP-${request._id.toString().slice(-8).toUpperCase()}\nStatus: ${status}\nCurrent Stage: ${request.currentStage}\n`;
    if (status.toLowerCase() === 'approved') {
      emailBody += `Cost Estimate: ${request.costEstimate || 'Not provided'}\nTime Estimate: ${request.timeEstimate || 'Not provided'}\n`;
    } else if (status.toLowerCase() === 'rejected') {
      emailBody += `Reason: ${request.rejectionReason || 'Not provided'}\n`;
    }
    emailBody += '\nThank you,\nCricketXpert Repair Team';
    await sendEmail(request.customerId.email, `Repair Request Status Updated - REP-${request._id.toString().slice(-8).toUpperCase()}`, emailBody);

    res.json({ message: 'Repair request status updated sucessfully', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 6️ Customer Approve / Reject Estimate
 * - Customer can approve or reject the service estimate.
 * - Updates request status and current stage.
 * - Service Manager is notified.
 */
const customerApproveReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    const request = await RepairRequest.findById(id).populate('customerId', 'email username');
    if (!request) return res.status(404).json({ error: 'Repair request not found' });

    if (decision === 'approve') {
      request.status = 'Customer Approved';
      request.currentStage = 'Approved by Customer';
    } else if (decision === 'reject') {
      request.status = 'Customer Rejected';
      request.currentStage = 'Rejected by Customer';
    } else return res.status(400).json({ error: 'Invalid decision' });

    await request.save();

    if (process.env.SERVICE_MANAGER_EMAIL) {
      await sendEmail(
        process.env.SERVICE_MANAGER_EMAIL,
        `Customer ${decision}d Estimate - REP-${request._id.toString().slice(-8).toUpperCase()}`,
        `Repair Request ID: REP-${request._id.toString().slice(-8).toUpperCase()}\nCustomer: ${request.customerId.username}\nDecision: ${decision}\nStatus: ${request.status}`
      );
    }

    res.json({ message: `Customer has ${decision}d the estimate`, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 7️ Assign Technician
 * - Only after customer approves.
 * - Validates technician availability and skills.
 * - Technician is notified and status is updated to 'In Repair'.
 */
const assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId, assignmentNotes } = req.body;

    // Validate request exists and is in correct status
    const request = await RepairRequest.findById(id).populate('customerId', 'email username');
    if (!request) {
      return res.status(404).json({ error: 'Repair request not found' });
    }
    
    if (request.status !== 'Customer Approved') {
      return res.status(400).json({ 
        error: 'Cannot assign technician. Request must be approved by customer first.' 
      });
    }

    // Validate technician exists
    const technician = await Technician.findById(technicianId).populate('technicianId', 'email username');
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Validate technician availability
    if (!technician.available) {
      return res.status(400).json({ 
        error: 'Technician is currently unavailable for new assignments' 
      });
    }

    // Count active repairs for this technician
    const activeRepairs = await RepairRequest.countDocuments({
      assignedTechnician: technicianId,
      status: { $in: ['In Repair', 'Halfway Completed'] }
    });

    if (activeRepairs >= 10) {
      return res.status(400).json({ 
        error: 'Technician has reached maximum capacity (10 active repairs). Please assign to another technician.' 
      });
    }

    // Validate technician skills match equipment type (optional enhancement)
    const equipmentType = request.equipmentType;
    const technicianSkills = technician.skills || [];
    
    // Check if technician has skills for this equipment type
    const hasRelevantSkill = technicianSkills.some(skill => 
      skill.toLowerCase().includes(equipmentType ? equipmentType.replace('_', ' ').toLowerCase() : '') ||
      skill.toLowerCase().includes('general') ||
      skill.toLowerCase().includes('all')
    );

    if (!hasRelevantSkill && technicianSkills.length > 0) {
      return res.status(400).json({ 
        error: `Technician does not have skills for ${equipmentType ? equipmentType.replace('_', ' ') : 'unknown'} repairs. Please assign to a qualified technician.` 
      });
    }

    // Assign technician to request
    request.assignedTechnician = technicianId;
    request.status = 'In Repair';
    request.currentStage = 'Technician Assigned';
    if (assignmentNotes) {
      request.notes = assignmentNotes;
    }
    await request.save();

    // Update technician availability if they reach capacity
    if (activeRepairs + 1 >= 10) {
      technician.available = false;
      await technician.save();
    }

    // Send notification emails
    try {
      console.log('📧 SENDING TECHNICIAN ASSIGNMENT EMAIL WITH NEW FORMAT');
      await sendEmail(
        technician.technicianId.email, 
        `New Repair Assignment - REP-${request._id.toString().slice(-8).toUpperCase()}`, 
        `You have been assigned a new repair request:\n\nRequest ID: REP-${request._id.toString().slice(-8).toUpperCase()}\nCustomer ID: CUST-${request.customerId._id.toString().slice(-6).toUpperCase()}\nCustomer: ${request.customerId.username}\nEquipment: ${equipmentType ? equipmentType.replace('_', ' ') : 'Unknown'}\nDamage Type: ${request.damageType}\nStatus: In Repair\n\nPlease begin work on this repair.`
      );
      
      console.log('📧 SENDING CUSTOMER ASSIGNMENT EMAIL WITH NEW FORMAT');
      await sendEmail(
        request.customerId.email, 
        `Technician Assigned - REP-${request._id.toString().slice(-8).toUpperCase()}`, 
        `Your repair request has been assigned to a technician:\n\nRequest ID: REP-${request._id.toString().slice(-8).toUpperCase()}\nCustomer ID: CUST-${request.customerId._id.toString().slice(-6).toUpperCase()}\nEquipment: ${equipmentType ? equipmentType.replace('_', ' ') : 'Unknown'}\nDamage Type: ${request.damageType}\nStatus: In Repair\nTechnician: ${technician.technicianId.firstName} ${technician.technicianId.lastName}\n\nYour repair is now in progress.`
      );
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the assignment if email fails
    }

    res.json({ 
      message: 'Technician assigned successfully', 
      request: {
        _id: request._id,
        status: request.status,
        currentStage: request.currentStage,
        assignedTechnician: technician.technicianId.username,
        equipmentType: request.equipmentType,
        damageType: request.damageType
      }
    });
  } catch (err) {
    console.error('Technician assignment error:', err);
    res.status(500).json({ error: err.message });
  }
};

  // Update repairProgress
const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { repairProgress, notes } = req.body;

    const request = await RepairRequest.findById(id)
      .populate('customerId', 'email username')
      .populate({ path: 'assignedTechnician', populate: { path: 'technicianId', select: 'username firstName lastName' } });
    if (!request) return res.status(404).json({ error: 'Repair request not found' });

    if (repairProgress === undefined || repairProgress < 0 || repairProgress > 100) {
      return res.status(400).json({ error: 'repairProgress must be between 0 and 100' });
    }

    const previousProgress = request.repairProgress || 0;
    const previousStatus = request.status;
    const previousStage = request.currentStage;

    request.repairProgress = repairProgress;

    // Auto-update status & currentStage based on milestones
    if (repairProgress === 0) {
      request.status = 'In Repair';
      request.currentStage = 'Repair Started';
    } else if (repairProgress > 0 && repairProgress < 25) {
      request.status = 'In Repair';
      request.currentStage = 'Repair Started';
    } else if (repairProgress >= 25 && repairProgress < 50) {
      request.status = 'In Repair';
      request.currentStage = 'Repair In Progress';
    } else if (repairProgress >= 50 && repairProgress < 75) {
      request.status = 'Halfway Completed';
      request.currentStage = 'Repair Halfway Completed';
    } else if (repairProgress >= 75 && repairProgress < 100) {
      request.status = 'Halfway Completed';
      request.currentStage = 'Almost Complete';
    } else if (repairProgress === 100) {
      request.status = 'Ready for Pickup';
      request.currentStage = 'Repair Complete';
    
      // Mark technician available if <10 active repairs remain
      if (request.assignedTechnician) {
        const technician = await Technician.findById(request.assignedTechnician);
        if (technician) {
          const activeRepairs = await RepairRequest.countDocuments({
            assignedTechnician: technician._id,
            status: { $in: ['In Repair', 'Halfway Completed'] }
          });
          if (activeRepairs < 10) {
            technician.available = true;
            await technician.save();
          }
        }
      }
    }

    // Save updated repair request
    await request.save();

    // Create repair progress notification for milestones
    const milestones = [0, 25, 50, 75, 100];
    const isMilestone = milestones.includes(repairProgress);
    
    if (isMilestone) {
      try {
        await repairNotificationController.createRepairStatusNotification(
          request.customerId._id,
          request._id,
          request.status,
          {
            equipmentType: request.equipmentType,
            damageType: request.damageType,
            status: request.status,
            repairProgress: request.repairProgress
          }
        );
        console.log('✅ Repair progress notification created successfully');
      } catch (notificationError) {
        console.error('❌ Failed to create repair progress notification:', notificationError);
        // Don't fail the progress update if notification fails
      }
    }

    const milestoneMessages = {
      0: '🔧 Repair Started',
      25: '⚡ Repair In Progress',
      50: '🎯 Halfway Completed',
      75: '🚀 Almost Complete',
      100: '✅ Ready for Pickup'
    };

    // Send enhanced email notification to customer
    try {
      let emailSubject = 'Repair Progress Updated';
      let emailBody = `Hello ${request.customerId.username},\n\n`;

      if (isMilestone) {
        emailSubject = milestoneMessages[repairProgress];
        emailBody += `🎉 ${milestoneMessages[repairProgress]}!\n\n`;
      }

      emailBody += `Your repair request has been updated:\n\n`;
      emailBody += `📊 Progress: ${request.repairProgress}%\n`;
      emailBody += `📋 Status: ${request.status}\n`;
      emailBody += `📍 Current Stage: ${request.currentStage}\n`;
      
      if (request.assignedTechnician?.technicianId) {
        const tech = request.assignedTechnician.technicianId;
        emailBody += `👨‍🔧 Technician: ${tech.firstName} ${tech.lastName} (@${tech.username})\n`;
      }

      if (notes && notes.trim()) {
        emailBody += `\n📝 Technician Notes:\n${notes}\n`;
      }

      if (isMilestone) {
        emailBody += `\n🎯 This is a key milestone in your repair process!\n`;
      }

      emailBody += `\nThank you for choosing our service!\n\nBest regards,\nCricketXpert Repair Team`;

      await sendEmail(request.customerId.email, emailSubject, emailBody);
    } catch (emailError) {
      console.error('Failed to send customer email notification:', emailError);
      // Don't fail the progress update if email fails
    }

    // Send notification to service manager if it's a milestone
    if (isMilestone && process.env.SERVICE_MANAGER_EMAIL) {
      try {
        const managerSubject = `Milestone Update: ${milestoneMessages[repairProgress]}`;
        const managerBody = `A repair request has reached a milestone:\n\n`;
        managerBody += `Customer: ${request.customerId.username}\n`;
        managerBody += `Equipment: ${request.equipmentType ? request.equipmentType.replace('_', ' ') : 'Unknown'}\n`;
        managerBody += `Damage: ${request.damageType}\n`;
        managerBody += `Progress: ${request.repairProgress}%\n`;
        managerBody += `Status: ${request.status}\n`;
        managerBody += `Stage: ${request.currentStage}\n`;
        
        if (request.assignedTechnician?.technicianId) {
          const tech = request.assignedTechnician.technicianId;
          managerBody += `Technician: ${tech.firstName} ${tech.lastName}\n`;
        }

        await sendEmail(process.env.SERVICE_MANAGER_EMAIL, managerSubject, managerBody);
      } catch (managerEmailError) {
        console.error('Failed to send service manager email notification:', managerEmailError);
        // Don't fail the progress update if email fails
      }
    }

    res.json({ 
      message: 'Progress updated successfully', 
      request,
      isMilestone,
      milestoneMessage: isMilestone ? milestoneMessages[repairProgress] : null
    });

  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * 8 Customer Dashboard
 */
const getCustomerRepairRequests = async (req, res) => {
  try {
    const { customerId } = req.params;
    const requests = await RepairRequest.find({ customerId })
      .populate('assignedTechnician')
      .sort({ createdAt: -1 });

    // Return requests exactly as they are in the database - NO MODIFICATIONS
    const fixedRequests = requests.map(request => request.toObject());
    
    // Temporary debug to see what we're returning
    console.log('🔍 RETURNING TO FRONTEND:', fixedRequests.map(req => ({
      id: req._id,
      description: req.description,
      damageType: req.damageType
    })));
    console.log('🔍 FIRST REQUEST DESCRIPTION:', fixedRequests[0]?.description);
    console.log('🔍 FIRST REQUEST DESCRIPTION TYPE:', typeof fixedRequests[0]?.description);
    console.log('🔍 FIRST REQUEST DESCRIPTION LENGTH:', fixedRequests[0]?.description?.length);
    
    // Debug: Check raw database data
    console.log('🔍 RAW DATABASE DATA:', requests.map(req => ({
      id: req._id,
      description: req.description,
      damageType: req.damageType
    })));
    
    res.json(fixedRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 9 Technician Dashboard
 */
const getTechnicianRepairRequests = async (req, res) => {
  try {
    const { technicianId } = req.params;
    const { status } = req.query;

    let filter = { assignedTechnician: technicianId };
    if (status) filter.status = status;

    const requests = await RepairRequest.find(filter)
      .populate('customerId', 'username email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 9.1 Technician Dashboard - Get estimate time and count
 */
const getTechnicianEstimateData = async (req, res) => {
  try {
    const { technicianId } = req.params;

    // Get all repair requests assigned to this technician
    const requests = await RepairRequest.find({ assignedTechnician: technicianId })
      .populate('customerId', 'username email firstName lastName')
      .sort({ createdAt: -1 });

    // Calculate estimate time for each request
    const requestsWithEstimate = requests.map(request => {
      let estimatedCompletionTime = null;
      
      if (request.timeEstimate) {
        // Parse time estimate - handle both string and numeric formats
        const timeStr = String(request.timeEstimate).toLowerCase();
        const requestCreatedAt = new Date(request.createdAt); // Use request creation time instead of current time
        let daysToAdd = 0;
        
        // If it's just a number, assume it's days
        if (/^\d+$/.test(timeStr.trim())) {
          daysToAdd = parseInt(timeStr.trim());
        } else if (timeStr.includes('hour')) {
          const hours = parseInt(timeStr.match(/\d+/)?.[0] || '0');
          daysToAdd = hours / 24;
        } else if (timeStr.includes('day')) {
          daysToAdd = parseInt(timeStr.match(/\d+/)?.[0] || '0');
        } else if (timeStr.includes('week')) {
          const weeks = parseInt(timeStr.match(/\d+/)?.[0] || '0');
          daysToAdd = weeks * 7;
        }
        
        if (daysToAdd > 0) {
          // Calculate due date from request creation time + time estimate
          estimatedCompletionTime = new Date(requestCreatedAt.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        }
      }

      return {
        ...request.toObject(),
        estimatedCompletionTime
      };
    });

    // Count by status
    const statusCounts = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'Pending').length,
      approved: requests.filter(r => r.status === 'Approved').length,
      inRepair: requests.filter(r => r.status === 'In Repair').length,
      estimateSent: requests.filter(r => r.status === 'Estimate Sent').length,
      customerApproved: requests.filter(r => r.status === 'Customer Approved').length,
      completed: requests.filter(r => r.status === 'Completed').length
    };

    // Calculate average estimate time
    const requestsWithTime = requestsWithEstimate.filter(r => r.estimatedCompletionTime);
    const averageEstimateDays = requestsWithTime.length > 0 
      ? requestsWithTime.reduce((sum, r) => {
          const days = (r.estimatedCompletionTime - new Date()) / (1000 * 60 * 60 * 24);
          return sum + Math.max(0, days);
        }, 0) / requestsWithTime.length
      : 0;

    res.json({
      requests: requestsWithEstimate,
      statusCounts,
      averageEstimateDays: Math.round(averageEstimateDays * 10) / 10,
      totalActiveRequests: statusCounts.total - statusCounts.completed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 9.2 Technician Dashboard - Get notifications for repairs due within 3 days
 */
const getTechnicianNotifications = async (req, res) => {
  try {
    const { technicianId } = req.params;
    console.log('🔔 DEBUG: Getting notifications for technician:', technicianId);

    // Get repair requests assigned to this technician that are due within 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    console.log('🔔 DEBUG: Three days from now:', threeDaysFromNow);

    const requests = await RepairRequest.find({ 
      assignedTechnician: technicianId,
      status: { $in: ['Approved', 'Estimate Sent', 'Customer Approved', 'In Repair', 'Halfway Completed'] }
    })
      .populate('customerId', 'username email firstName lastName')
      .sort({ createdAt: -1 });
    
    console.log('🔔 DEBUG: Found', requests.length, 'requests for technician');
    console.log('🔔 DEBUG: Request details:', requests.map(r => ({
      id: r._id,
      status: r.status,
      timeEstimate: r.timeEstimate,
      createdAt: r.createdAt,
      assignedTechnician: r.assignedTechnician
    })));

    // Filter requests that are due within 3 days based on time estimate
    const urgentRequests = requests.filter(request => {
      console.log('🔔 DEBUG: Checking request:', request._id, 'timeEstimate:', request.timeEstimate);
      
      if (!request.timeEstimate) {
        console.log('🔔 DEBUG: No timeEstimate for request:', request._id);
        return false;
      }
      
      const timeStr = String(request.timeEstimate).toLowerCase();
      const requestCreatedAt = new Date(request.createdAt); // Use request creation time instead of current time
      let daysToAdd = 0;
      
      console.log('🔔 DEBUG: timeStr:', timeStr, 'createdAt:', requestCreatedAt);
      
      // If it's just a number, assume it's days
      if (/^\d+$/.test(timeStr.trim())) {
        daysToAdd = parseInt(timeStr.trim());
      } else if (timeStr.includes('hour')) {
        const hours = parseInt(timeStr.match(/\d+/)?.[0] || '0');
        daysToAdd = hours / 24;
      } else if (timeStr.includes('day')) {
        daysToAdd = parseInt(timeStr.match(/\d+/)?.[0] || '0');
      } else if (timeStr.includes('week')) {
        const weeks = parseInt(timeStr.match(/\d+/)?.[0] || '0');
        daysToAdd = weeks * 7;
      }
      
      console.log('🔔 DEBUG: daysToAdd:', daysToAdd);
      
      if (daysToAdd > 0) {
        // Calculate due date from request creation time + time estimate
        const estimatedCompletion = new Date(requestCreatedAt.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        
        // Compare dates by day only (ignore time) to avoid millisecond precision issues
        // Use UTC dates to avoid timezone issues
        const estimatedCompletionDate = new Date(Date.UTC(estimatedCompletion.getUTCFullYear(), estimatedCompletion.getUTCMonth(), estimatedCompletion.getUTCDate()));
        const threeDaysFromNowDate = new Date(Date.UTC(threeDaysFromNow.getUTCFullYear(), threeDaysFromNow.getUTCMonth(), threeDaysFromNow.getUTCDate()));
        const isUrgent = estimatedCompletionDate <= threeDaysFromNowDate;
        
        console.log('🔔 DEBUG: estimatedCompletion:', estimatedCompletion);
        console.log('🔔 DEBUG: estimatedCompletionDate (day only):', estimatedCompletionDate);
        console.log('🔔 DEBUG: threeDaysFromNow:', threeDaysFromNow);
        console.log('🔔 DEBUG: threeDaysFromNowDate (day only):', threeDaysFromNowDate);
        console.log('🔔 DEBUG: isUrgent:', isUrgent);
        
        return isUrgent;
      }
      
      return false;
    });
    
    console.log('🔔 DEBUG: Found', urgentRequests.length, 'urgent requests');

    // Create notification objects
    const notifications = urgentRequests.map(request => {
      const timeStr = String(request.timeEstimate).toLowerCase();
      const requestCreatedAt = new Date(request.createdAt); // Use request creation time instead of current time
      let daysToAdd = 0;
      
      // If it's just a number, assume it's days
      if (/^\d+$/.test(timeStr.trim())) {
        daysToAdd = parseInt(timeStr.trim());
      } else if (timeStr.includes('hour')) {
        const hours = parseInt(timeStr.match(/\d+/)?.[0] || '0');
        daysToAdd = hours / 24;
      } else if (timeStr.includes('day')) {
        daysToAdd = parseInt(timeStr.match(/\d+/)?.[0] || '0');
      } else if (timeStr.includes('week')) {
        const weeks = parseInt(timeStr.match(/\d+/)?.[0] || '0');
        daysToAdd = weeks * 7;
      }
      
      // Calculate due date from request creation time + time estimate
      const estimatedCompletion = new Date(requestCreatedAt.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      const daysUntilDue = Math.ceil((estimatedCompletion - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        id: request._id,
        type: 'urgent_repair',
        title: 'Repair Due Soon',
        message: `Repair request for ${request.customerId?.firstName || request.customerId?.username} is due in ${daysUntilDue} day(s)`,
        requestId: request._id,
        customerName: `${request.customerId?.firstName || ''} ${request.customerId?.lastName || ''}`.trim() || request.customerId?.username,
        equipmentType: request.equipmentType,
        damageType: request.damageType,
        status: request.status,
        estimatedCompletion,
        daysUntilDue,
        createdAt: request.createdAt,
        isRead: false
      };
    });

    res.json({
      notifications,
      unreadCount: notifications.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 10️ Service Manager Dashboard (with filtering & sorting)
const getAllRepairRequestsWithFilter = async (req, res) => {
  try {
    const { status, customerId, technicianId, sortBy, sortOrder } = req.query;

    // Build filter object
    let filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (technicianId) filter.assignedTechnician = technicianId;

    // Build sort order
    let sort = { createdAt: -1 };
    const order = String(sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    if ((sortBy || '').toLowerCase() === 'status') {
      sort = { status: order, createdAt: -1 };
    } else if ((sortBy || '').toLowerCase() === 'date') {
      sort = { createdAt: order };
    }

    const requests = await RepairRequest.find(filter)
      .populate('customerId', 'username email')
      .populate({ path: 'assignedTechnician', populate: { path: 'technicianId', select: 'username email skills' } })
      .sort(sort);

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};





/**
 * 11 Download & Email PDF (for frontend download button)
 */
const downloadAndEmailReport = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('PDF download requested for repair ID:', id);

    const request = await RepairRequest.findById(id)
      .populate('customerId', 'username email')
      .populate({ path: 'assignedTechnician', populate: { path: 'technicianId', select: 'username email' } });

    if (!request) {
      console.log('Repair request not found for ID:', id);
      return res.status(404).json({ error: 'Repair request not found' });
    }

    console.log('Found repair request:', {
      id: request._id,
      customer: request.customerId?.username,
      status: request.status
    });

    // Send email first, then download PDF
    try {
      await sendRepairReportEmail(request); // send email
      console.log('Email sent successfully for repair ID:', id);
    } catch (emailError) {
      console.error('Failed to send email for repair ID:', id, emailError.message);
      // Continue with PDF download even if email fails
    }
    
    pipeRepairReportToResponse(res, request); // download in browser

  } catch (err) {
    console.error('Error in downloadAndEmailReport:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * 12 Delete Repair Request
 * - Removes a repair request from the database.
 */
const deleteRepairRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RepairRequest.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Repair request not found' });
    res.json({ message: 'Repair request deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 13 Get Repair Revenue Data
 * - Returns repair requests with cost estimates for revenue calculation
 * - Supports filtering by month and year
 */
const getRepairRevenue = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    
    // Build filter object
    let filter = {
      costEstimate: { $exists: true, $gt: 0 } // Only requests with cost estimates
    };
    
    // Add date filter if month/year provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    const requests = await RepairRequest.find(filter)
      .populate('customerId', 'username email')
      .populate({ path: 'assignedTechnician', populate: { path: 'technicianId', select: 'username email' } })
      .sort({ createdAt: -1 });
    
    // Calculate totals
    const totalRevenue = requests.reduce((sum, request) => sum + (request.costEstimate || 0), 0);
    const totalRequests = requests.length;
    const averageEstimate = totalRequests > 0 ? totalRevenue / totalRequests : 0;
    
    res.json({
      requests,
      summary: {
        totalRevenue,
        totalRequests,
        averageEstimate: Math.round(averageEstimate)
      }
    });
  } catch (err) {
    console.error('Error fetching repair revenue data:', err);
    res.status(500).json({ error: err.message });
  }
};

export default {
  createRepairRequest,
  testRepairRequest,
  debugRepairRequests,
  testDescriptionFlow,
  testDescriptionSimple,
  checkDatabaseDescription,
  getAllRepairRequests,
  getAllRepairRequestsWithFilter,
  getRepairRequestById,
  updateRepairGeneral,
  deleteRepairRequest,
  getCustomerRepairRequests,
  getTechnicianRepairRequests,
  getTechnicianEstimateData,
  getTechnicianNotifications,
  updateRequestStatus,
  customerApproveReject,
  assignTechnician,
  updateProgress,
  downloadAndEmailReport,
  getRepairRevenue,

};
 