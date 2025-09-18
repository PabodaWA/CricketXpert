const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Customer submits feedback
router.post('/', feedbackController.createFeedback);

// Service Manager - view all feedbacks
router.get('/', feedbackController.getAllFeedback);

// Get single feedback by ID
router.get('/:id', feedbackController.getFeedbackById);


// Service Manager updates feedback (status or response)
router.put('/:id', feedbackController.updateFeedback);

// Customer deletes feedback (optional)
router.delete('/:id', feedbackController.deleteFeedback);

// Customer Dashboard - get all feedbacks by customer
router.get('/dashboard/customer/:customerId', feedbackController.getCustomerFeedbacks);

module.exports = router;
