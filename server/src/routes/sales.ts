import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createSale, getSales, getSaleItems, getSaleById } from '../controllers/sales.controller.js';
import { ReceiptService } from '../services/receipt.service.js';

const router = express.Router();

// Apply authentication middleware to all sales routes
router.use(authenticate);

// Create a new sale
router.post('/', createSale);

// Get all sales with pagination
router.get('/', getSales);

// Get a specific sale by ID
router.get('/:id', getSaleById);

// Get items for a specific sale
router.get('/:id/items', getSaleItems);

// Send receipt routes
router.post('/:id/receipt/whatsapp', async (req, res) => {
  try {
    const saleId = parseInt(req.params.id);
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    const success = await ReceiptService.sendWhatsApp(saleId, phoneNumber);
    
    if (success) {
      return res.json({ message: 'Receipt sent via WhatsApp' });
    } else {
      return res.status(500).json({ message: 'Failed to send WhatsApp receipt' });
    }
  } catch (error) {
    console.error('WhatsApp receipt error:', error);
    res.status(500).json({ message: 'Error sending WhatsApp receipt' });
  }
});

router.post('/:id/receipt/sms', async (req, res) => {
  try {
    const saleId = parseInt(req.params.id);
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    const success = await ReceiptService.sendSMS(saleId, phoneNumber);
    
    if (success) {
      return res.json({ message: 'Receipt sent via SMS' });
    } else {
      return res.status(500).json({ message: 'Failed to send SMS receipt' });
    }
  } catch (error) {
    console.error('SMS receipt error:', error);
    res.status(500).json({ message: 'Error sending SMS receipt' });
  }
});

export default router; 