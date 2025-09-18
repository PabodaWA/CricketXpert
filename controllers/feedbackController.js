const Feedback = require('../models/Feedback');
const RepairRequest = require('../models/RepairRequest');
const { sendEmail } = require('../utils/notification');

/**
 * 1️⃣ Submit Feedback (Customer)
 */
exports.createFeedback = async (req, res) => {
  try {
    const { requestId, requestType, customerId, description, category } = req.body;

        if (!requestId || !requestType || !customerId || !description) {
      return res.status(400).json({ error: 'requestId, requestType, customerId, and description are required' });
    }

    // Create feedback
    const feedback = await Feedback.create({
      requestId,
      requestType,
      customerId,
      description,
      category
    });

    // If the feedback is related to a RepairRequest, notify Service Manager
    if (requestType === 'RepairRequest' && process.env.SERVICE_MANAGER_EMAIL) {
      const repair = await RepairRequest.findById(requestId).populate('customerId', 'username email');
      const customerName = repair?.customerId?.username || 'Customer';

      await sendEmail(
        process.env.SERVICE_MANAGER_EMAIL,
        `New Feedback on Repair Request`,
        `Feedback from ${customerName}\n\n regarding Repair Request ID: ${requestId}.\n\nFeedback: ${description}`
      );
    }

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 2️⃣ Get All Feedbacks (Service Manager Dashboard)
 */
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ requestType: 'RepairRequest' })
      .populate('customerId', 'username email')
      .populate('requestId', 'damageType status')
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Get single feedback by ID
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id)
      .populate('customerId', 'username email')
      .populate('requestId', 'damageType status');

    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * 3️⃣ Update Feedback (Service Manager)
 * - Update status or add response
 * - Send email to customer when responded
 */
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const feedback = await Feedback.findById(id).populate('customerId', 'email username');
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

    if (status) feedback.status = status;
    if (response) feedback.response = response;

    await feedback.save();

    // Send email to customer notifying response or status update
    if (feedback.customerId?.email) {
      let emailBody = `Hello ${feedback.customerId.username},\n\nYour feedback has been updated.\n`;
      if (status) emailBody += `Status: ${status}\n`;
      if (response) emailBody += `Response: ${response}\n`;
      emailBody += `\nThank you,\nService Team`;

      await sendEmail(feedback.customerId.email, 'Feedback Update', emailBody);
    }

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 4️⃣ Delete Feedback
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Feedback.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Feedback not found' });
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 5️⃣ Customer Dashboard - Get feedbacks submitted by customer
 */
exports.getCustomerFeedbacks = async (req, res) => {
  try {
    const { customerId } = req.params;
    const feedbacks = await Feedback.find({ customerId })
      .populate('requestId', 'damageType status')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
