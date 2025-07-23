import { Request, Response } from 'express';
import { ReceiptSettings, Store } from '../models/index.js';

// Get receipt settings for a store
export const getReceiptSettings = async (req: Request, res: Response) => {
  const storeId = parseInt(req.params.storeId);
  if (isNaN(storeId)) {
    return res.status(400).json({ message: 'Invalid store ID' });
  }
  try {
    const settings = await ReceiptSettings.findOne({ where: { store_id: storeId } });
    if (!settings) {
      return res.status(404).json({ message: 'Receipt settings not found for this store' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch receipt settings', error });
  }
};

// Create receipt settings for a store
export const createReceiptSettings = async (req: Request, res: Response) => {
  const storeId = parseInt(req.params.storeId);
  if (isNaN(storeId)) {
    return res.status(400).json({ message: 'Invalid store ID' });
  }
  try {
    // Only allow one settings per store
    const existing = await ReceiptSettings.findOne({ where: { store_id: storeId } });
    if (existing) {
      return res.status(400).json({ message: 'Receipt settings already exist for this store' });
    }
    const settings = await ReceiptSettings.create({ ...req.body, store_id: storeId });
    res.status(201).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create receipt settings', error });
  }
};

// Update receipt settings for a store
export const updateReceiptSettings = async (req: Request, res: Response) => {
  const storeId = parseInt(req.params.storeId);
  if (isNaN(storeId)) {
    return res.status(400).json({ message: 'Invalid store ID' });
  }
  try {
    let settings = await ReceiptSettings.findOne({ where: { store_id: storeId } });
    if (!settings) {
      // If not found, create new settings
      settings = await ReceiptSettings.create({ ...req.body, store_id: storeId });
      return res.status(201).json(settings);
    }
    await settings.update(req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update or create receipt settings', error });
  }
}; 