import express from 'express';
import { contactSupplier } from '../controllers/supplierController.js';

const router = express.Router();

// Contact supplier for low stock items
router.post('/contact-supplier', contactSupplier);

export default router;

