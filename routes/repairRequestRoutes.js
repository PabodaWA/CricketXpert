import express from 'express';
import repairController from '../controllers/repairRequestController.js';
const router = express.Router();

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

// Test endpoint to verify data saving
router.post('/test', repairController.testRepairRequest);

// Debug endpoint to check database contents
router.get('/debug', repairController.debugRepairRequests);

// Test endpoint to verify description flow
router.post('/test-description', repairController.testDescriptionFlow);

// Simple test endpoint for description
router.post('/test-simple', repairController.testDescriptionSimple);

// Check database descriptions
router.get('/check-db', repairController.checkDatabaseDescription);

// Update a repair request (Customer)
router.put('/:id', repairController.updateRepairGeneral);

// Delete repair request
router.delete('/:id', repairController.deleteRepairRequest);

// Get repair revenue data with filtering
router.get('/revenue/data', repairController.getRepairRevenue);

export default router;
