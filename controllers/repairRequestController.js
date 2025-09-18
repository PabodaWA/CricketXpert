const RepairRequest = require('../models/RepairRequest');
const Technician = require('../models/Technician');
const User = require('../models/User');
const { sendEmail } = require('../utils/notification');
const { pipeRepairReportToResponse, sendRepairReportEmail } = require('../utils/reportGenerator');


/**
 * 1️ Create a new Repair Request (Customer)
 * - Customer submits a repair request with damage details.
 * - Status is set to 'Pending'.
 * - Service Manager is notified via email.
 */
exports.createRepairRequest = async (req, res) => {
  try {
    const { customerId, equipmentType, damageType, description } = req.body;

    if (!customerId || !equipmentType || !damageType || !description)
      return res.status(400).json({ error: 'customerId, equipmentType, damageType, and description are required' });

    const repairRequest = await RepairRequest.create({
      customerId,
      equipmentType,
      damageType,
      description,
      status: 'Pending',
      repairProgress: 0,
      currentStage: 'Request Submitted'
    });
    //Notify Service Manager
    if (process.env.SERVICE_MANAGER_EMAIL) {
      await sendEmail(
        process.env.SERVICE_MANAGER_EMAIL,
        'New Repair Request Submitted',
        `A new repair request has been submitted.\n\nCustomer ID: ${customerId}\nEquipment: ${equipmentType}\nDamage Type: ${damageType}`
      );
    }

    res.status(201).json({ message: 'Repair request created', repairRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 2️ Update Repair Request (General)
 * - Allows updating general fields of a repair request.
 * - Service Manager is notified of any changes.
 */
exports.updateRepairGeneral = async (req, res) => {
  try {
    const request = await RepairRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!request) return res.status(404).json({ error: 'Repair request not found' });

    if (process.env.SERVICE_MANAGER_EMAIL) {
      await sendEmail(
        process.env.SERVICE_MANAGER_EMAIL,
        'Repair Request Updated',
        `Repair request has been updated.\n\nCustomer ID: ${request.customerId}\nDamage Type: ${request.damageType}`
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
exports.getAllRepairRequests = async (req, res) => {
  try {
    const requests = await RepairRequest.find()
      .populate('customerId', 'username email')
      .populate({ path: 'assignedTechnician', populate: { path: 'technicianId', select: 'username email' } });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 4️ Get Repair Request By ID
 * - Returns a single repair request by ID.
 * - Populates customer and assigned technician details.
 */
exports.getRepairRequestById = async (req, res) => {
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
exports.updateRequestStatus = async (req, res) => {
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

    // Send email to customer
    let emailBody = `Hello ${request.customerId.username},\n\nYour repair request status is: ${status}\n`;
    if (status.toLowerCase() === 'approved') {
      emailBody += `Cost Estimate: ${request.costEstimate || 'Not provided'}\nTime Estimate: ${request.timeEstimate || 'Not provided'}\n`;
    } else if (status.toLowerCase() === 'rejected') {
      emailBody += `Reason: ${request.rejectionReason || 'Not provided'}\n`;
    }
    emailBody += '\nThank you,\nService Team';
    await sendEmail(request.customerId.email, 'Repair Request Status Updated', emailBody);

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
exports.customerApproveReject = async (req, res) => {
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
        `Customer ${decision}d Estimate`,
        `Repair Request ID: ${request._id}\nDecision: ${decision}`
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
exports.assignTechnician = async (req, res) => {
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
      skill.toLowerCase().includes(equipmentType.replace('_', ' ').toLowerCase()) ||
      skill.toLowerCase().includes('general') ||
      skill.toLowerCase().includes('all')
    );

    if (!hasRelevantSkill && technicianSkills.length > 0) {
      return res.status(400).json({ 
        error: `Technician does not have skills for ${equipmentType.replace('_', ' ')} repairs. Please assign to a qualified technician.` 
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
      await sendEmail(
        technician.technicianId.email, 
        'New Repair Assignment', 
        `You have been assigned a new repair request:\n\nRequest ID: ${request._id}\nEquipment: ${equipmentType.replace('_', ' ')}\nDamage Type: ${request.damageType}\nCustomer: ${request.customerId.username}\n\nPlease begin work on this repair.`
      );
      
      await sendEmail(
        request.customerId.email, 
        'Technician Assigned', 
        `Your repair request has been assigned to a technician:\n\nRequest ID: ${request._id}\nEquipment: ${equipmentType.replace('_', ' ')}\nDamage Type: ${request.damageType}\nStatus: In Repair\n\nYour repair is now in progress.`
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
exports.updateProgress = async (req, res) => {
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

    // Determine if this is a milestone update
    const milestones = [0, 25, 50, 75, 100];
    const isMilestone = milestones.includes(repairProgress);
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
        managerBody += `Equipment: ${request.equipmentType.replace('_', ' ')}\n`;
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
exports.getCustomerRepairRequests = async (req, res) => {
  try {
    const { customerId } = req.params;
    const requests = await RepairRequest.find({ customerId })
      .populate('assignedTechnician')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 9 Technician Dashboard
 */
exports.getTechnicianRepairRequests = async (req, res) => {
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

// 10️ Service Manager Dashboard (with filtering & sorting)
exports.getAllRepairRequests = async (req, res) => {
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
exports.downloadAndEmailReport = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await RepairRequest.findById(id)
      .populate('customerId', 'username email')
      .populate({ path: 'assignedTechnician', populate: { path: 'technicianId', select: 'username email' } });

    if (!request) return res.status(404).json({ error: 'Repair request not found' });

    await sendRepairReportEmail(request); // send email
    pipeRepairReportToResponse(res, request); // download in browser

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * 12 Delete Repair Request
 * - Removes a repair request from the database.
 */
exports.deleteRepairRequest = async (req, res) => {
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
 * 13 Submit Feedback
 * - Customer submits feedback for a completed repair request.
 * - Creates a feedback record and notifies service manager.
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, category } = req.body;

    // Validate required fields
    if (!rating || !comment || !category) {
      return res.status(400).json({
        error: 'Rating, comment, and category are required'
      });
    }

    // Validate rating (1-5)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check if repair request exists and is completed
    const repairRequest = await RepairRequest.findById(id);
    if (!repairRequest) {
      return res.status(404).json({
        error: 'Repair request not found'
      });
    }

    if (repairRequest.status !== 'Ready for Pickup') {
      return res.status(400).json({
        error: 'Feedback can only be submitted for completed repairs'
      });
    }

    // Create feedback record using existing model structure
    const Feedback = require('../models/Feedback');

    // Map frontend category to model category
    let mappedCategory = 'Repair'; // default
    if (category === 'quality') mappedCategory = 'Repair';
    else if (category === 'service') mappedCategory = 'Repair';
    else if (category === 'timing') mappedCategory = 'Repair';
    else if (category === 'communication') mappedCategory = 'Repair';
    else if (category === 'general') mappedCategory = 'Repair';

    // Include rating in the description since model doesn't have rating field
    const descriptionWithRating = `Rating: ${rating}/5 - ${comment}`;

    const feedback = await Feedback.create({
      requestId: id,
      requestType: 'RepairRequest',
      customerId: repairRequest.customerId,
      description: descriptionWithRating,
      category: mappedCategory,
      status: 'Open'
    });

    // Notify service manager about new feedback
    if (process.env.SERVICE_MANAGER_EMAIL) {
      await sendEmail(
        process.env.SERVICE_MANAGER_EMAIL,
        'New Feedback Received',
        `New feedback has been submitted for repair request ${id}.\n\nRating: ${rating}/5\nCategory: ${category}\nComment: ${comment}`
      );
    }

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        rating,
        comment,
        category,
        requestId: id
      }
    });

  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(500).json({ error: err.message });
  }
};
 