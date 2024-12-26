import { Router } from 'express';
import { db } from '../src/db';
import { customers } from '../src/db/schema/customer/schema';
import { eq, desc, ilike } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Define the customer schema for validation
const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

type CustomerFormData = z.infer<typeof customerSchema>;

// Get all customers
router.get('/', async (req, res) => {
  try {
    const allCustomers = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.created_at));

    res.json(allCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Search customers
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || typeof query !== 'string') {
      return res.json([]);
    }

    const searchResults = await db
      .select()
      .from(customers)
      .where(ilike(customers.name, `%${query}%`))
      .orderBy(customers.name);

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// Get a single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (!customer.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create a new customer
router.post('/', async (req, res) => {
  try {
    const validatedData = customerSchema.parse(req.body) as CustomerFormData;

    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || '',
        address: validatedData.address || '',
        notes: validatedData.notes || ''
      })
      .returning();

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({ error: 'Failed to create customer' });
  }
});

// Update a customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = customerSchema.parse(req.body) as CustomerFormData;

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || '',
        address: validatedData.address || '',
        notes: validatedData.notes || '',
        updated_at: new Date()
      })
      .where(eq(customers.id, parseInt(id)))
      .returning();

    if (!updatedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(400).json({ error: 'Failed to update customer' });
  }
});

// Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedCustomer] = await db
      .delete(customers)
      .where(eq(customers.id, parseInt(id)))
      .returning();

    if (!deletedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router; 