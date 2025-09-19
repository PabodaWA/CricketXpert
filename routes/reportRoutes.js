import express from 'express';
const router = express.Router();
import { 
  getOrderReport, 
  getProductSalesReport, 
  getRevenueReport 
} from '../controllers/reportController.js';

router.get('/orders', getOrderReport);
router.get('/product-sales', getProductSalesReport);
router.get('/revenue', getRevenueReport);

export default router;