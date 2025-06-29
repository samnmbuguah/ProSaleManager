import { Request, Response } from 'express';

export const getUsers = (req: Request, res: Response) => {
  res.json({ message: 'getUsers stub' });
};

export const getUser = (req: Request, res: Response) => {
  res.json({ message: 'getUser stub' });
};

export const createUser = (req: Request, res: Response) => {
  res.json({ message: 'createUser stub' });
};

export const updateUser = (req: Request, res: Response) => {
  res.json({ message: 'updateUser stub' });
};

export const deleteUser = (req: Request, res: Response) => {
  res.json({ message: 'deleteUser stub' });
}; 