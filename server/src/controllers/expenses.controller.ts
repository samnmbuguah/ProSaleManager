import { Request, Response } from 'express';
import Expense from '../models/Expense.js';
import sequelize from '../config/database.js';

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: expenses } = await Expense.findAndCountAll({
      limit,
      offset,
      order: [['date', 'DESC']],
      include: [{
        association: 'user',
        attributes: ['name']
      }]
    });

    res.json({
      expenses,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { description, amount, date, category, payment_method } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      await t.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const expense = await Expense.create({
      description,
      amount,
      date: date || new Date(),
      category,
      payment_method,
      user_id
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Failed to create expense' });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { description, amount, date, category, payment_method } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      await t.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const expense = await Expense.findByPk(id);
    if (!expense) {
      await t.rollback();
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.update({
      description,
      amount,
      date,
      category,
      payment_method
    }, { transaction: t });

    await t.commit();

    res.json({
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Failed to update expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      await t.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const expense = await Expense.findByPk(id);
    if (!expense) {
      await t.rollback();
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.destroy({ transaction: t });
    await t.commit();

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
}; 