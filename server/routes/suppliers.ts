import { Router } from 'express';
import { db } from '../src/db';
import { suppliers } from '../src/db/schema/supplier/schema';
import { eq, desc, ilike } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Define the supplier schema for validation
const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

type SupplierFormData = z.infer<typeof supplierSchema>;

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const allSuppliers = await db
      .select()
      .from(suppliers)
      .orderBy(desc(suppliers.created_at));

    res.json(allSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Search suppliers
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || typeof query !== 'string') {
      return res.json([]);
    }

    const searchResults = await db
      .select()
      .from(suppliers)
      .where(ilike(suppliers.name, `%${query}%`))
      .orderBy(suppliers.name);

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching suppliers:', error);
    res.status(500).json({ error: 'Failed to search suppliers' });
  }
});

// Get a single supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, parseInt(id)))
      .limit(1);

    if (!supplier.length) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier[0]);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// Create a new supplier
router.post('/', async (req, res) => {
  try {
    const validatedData = supplierSchema.parse(req.body) as SupplierFormData;

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || '',
        address: validatedData.address || '',
        notes: validatedData.notes || ''
      })
      .returning();

    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(400).json({ error: 'Failed to create supplier' });
  }
});

// Update a supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = supplierSchema.parse(req.body) as SupplierFormData;

    const [updatedSupplier] = await db
      .update(suppliers)
      .set({
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || '',
        address: validatedData.address || '',
        notes: validatedData.notes || '',
        updated_at: new Date()
      })
      .where(eq(suppliers.id, parseInt(id)))
      .returning();

    if (!updatedSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(400).json({ error: 'Failed to update supplier' });
  }
});

// Delete a supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedSupplier] = await db
      .delete(suppliers)
      .where(eq(suppliers.id, parseInt(id)))
      .returning();

    if (!deletedSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router; 