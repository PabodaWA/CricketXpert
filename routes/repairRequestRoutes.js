const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairRequestController');

// Customer Dashboard - Get all repair requests for a customer
router.get('/dashboard/customer/:customerId', repairController.getCustomerRepairRequests);

// Technician Dashboard - Get all repair requests for a technician (optional status filter)
router.get('/dashboard/technician/:technicianId', repairController.getTechnicianRepairRequests);

// Service Manager Dashboard - Get all repair requests
router.get('/dashboard/manager', repairController.getAllRepairRequests);

// Download repair report (PDF) and also email it
router.get('/report/download/:id', repairController.downloadAndEmailReport);


// Update repair status (Approve/Reject by Service Manager)
router.put('/status/:id', repairController.updateRequestStatus);

// Customer approves/rejects estimate
router.put('/customer-decision/:id', repairController.customerApproveReject);

// Assign technician to repair (Service Manager)
router.put('/assign/:id', repairController.assignTechnician);

// Update repair progress (Technician)
router.put('/progress/:id', repairController.updateProgress);

// Get a single repair request by ID
router.get('/:id', repairController.getRepairRequestById);

// Get all repair requests (Service Manager)
router.get('/', repairController.getAllRepairRequests);

// Create a new repair request (Customer)
router.post('/', repairController.createRepairRequest);

// Update a repair request (Customer)
router.put('/:id', repairController.updateRepairGeneral);

// Delete repair request
router.delete('/:id', repairController.deleteRepairRequest);

// Submit feedback for a repair request
router.post('/:id/feedback', repairController.submitFeedback);

module.exports = router;
