import { Request, Response } from 'express';

export const getOrders = (req: Request, res: Response) => {
  res.json({ message: 'getOrders stub' });
};

export const getOrder = (req: Request, res: Response) => {
  res.json({ message: 'getOrder stub' });
};

export const createOrder = (req: Request, res: Response) => {
  res.json({ message: 'createOrder stub' });
};

export const updateOrder = (req: Request, res: Response) => {
  res.json({ message: 'updateOrder stub' });
};

export const deleteOrder = (req: Request, res: Response) => {
  res.json({ message: 'deleteOrder stub' });
}; 