import { Router } from 'express';
import { db } from '../src/db';
import { 
  sales, 
  saleItems,
  type Sale,
  type SaleItem
} from '../src/db/schema/sale/schema';
import { products, productPricing } from '../src/db/schema/product/schema';
import { customers } from '../src/db/schema/customer/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Define the sale item schema for validation
const saleItemSchema = z.object({
  product_id: z.number(),
  unit_type: z.string(),
  quantity: z.number(),
  unit_price: z.string(),
  total_amount: z.string()
});

// Define the sale schema for validation
const saleSchema = z.object({
  customer_id: z.number().optional(),
  items: z.array(saleItemSchema),
  total_amount: z.string(),
  payment_method: z.enum(['cash', 'card', 'mobile_money']),
  payment_status: z.enum(['paid', 'pending', 'cancelled']),
  notes: z.string().optional()
});

type SaleFormData = z.infer<typeof saleSchema>;

// Get all sales
router.get('/', async (req, res) => {
  try {
    const allSales = await db
      .select({
        id: sales.id,
        customer_id: sales.customer_id,
        total_amount: sales.total_amount,
        payment_method: sales.payment_method,
        payment_status: sales.payment_status,
        notes: sales.notes,
        created_at: sales.created_at,
        updated_at: sales.updated_at,
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          email: customers.email
        }
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customer_id, customers.id))
      .orderBy(desc(sales.created_at));

    const salesWithItems = await Promise.all(
      allSales.map(async (sale) => {
        const items = await db
          .select({
            id: saleItems.id,
            sale_id: saleItems.sale_id,
            product_id: saleItems.product_id,
            unit_type: saleItems.unit_type,
            quantity: saleItems.quantity,
            unit_price: saleItems.unit_price,
            total_amount: saleItems.total_amount,
            product: {
              id: products.id,
              name: products.name,
              sku: products.sku
            }
          })
          .from(saleItems)
          .leftJoin(products, eq(saleItems.product_id, products.id))
          .where(eq(saleItems.sale_id, sale.id));

        return {
          ...sale,
          items
        };
      })
    );

    res.json(salesWithItems);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Get a single sale by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await db
      .select({
        id: sales.id,
        customer_id: sales.customer_id,
        total_amount: sales.total_amount,
        payment_method: sales.payment_method,
        payment_status: sales.payment_status,
        notes: sales.notes,
        created_at: sales.created_at,
        updated_at: sales.updated_at,
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          email: customers.email
        }
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customer_id, customers.id))
      .where(eq(sales.id, parseInt(id)))
      .limit(1);

    if (!sale.length) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const items = await db
      .select({
        id: saleItems.id,
        sale_id: saleItems.sale_id,
        product_id: saleItems.product_id,
        unit_type: saleItems.unit_type,
        quantity: saleItems.quantity,
        unit_price: saleItems.unit_price,
        total_amount: saleItems.total_amount,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku
        }
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.product_id, products.id))
      .where(eq(saleItems.sale_id, parseInt(id)));

    res.json({
      ...sale[0],
      items
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
});

// Create a new sale
router.post('/', async (req, res) => {
  try {
    const validatedData = saleSchema.parse(req.body) as SaleFormData;

    await db.transaction(async (tx) => {
      // Create the sale
      const [newSale] = await tx
        .insert(sales)
        .values({
          customer_id: validatedData.customer_id,
          total_amount: validatedData.total_amount,
          payment_method: validatedData.payment_method,
          payment_status: validatedData.payment_status,
          notes: validatedData.notes || ''
        })
        .returning();

      // Create sale items
      const saleItemsData = validatedData.items.map((item) => ({
        sale_id: newSale.id,
        product_id: item.product_id,
        unit_type: item.unit_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount
      }));

      await tx.insert(saleItems).values(saleItemsData);

      // Update product stock
      for (const item of validatedData.items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.product_id))
          .limit(1);

        if (product) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`,
              updated_at: new Date()
            })
            .where(eq(products.id, item.product_id));
        }
      }
    });

    res.status(201).json({ message: 'Sale created successfully' });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(400).json({ error: 'Failed to create sale' });
  }
});

// Update a sale's payment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!['paid', 'pending', 'cancelled'].includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    await db
      .update(sales)
      .set({
        payment_status,
        updated_at: new Date()
      })
      .where(eq(sales.id, parseInt(id)));

    res.json({ message: 'Sale status updated successfully' });
  } catch (error) {
    console.error('Error updating sale status:', error);
    res.status(500).json({ error: 'Failed to update sale status' });
  }
});

// Delete a sale
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.transaction(async (tx) => {
      // Get sale items to restore product stock
      const saleItemsList = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.sale_id, parseInt(id)));

      // Restore product stock
      for (const item of saleItemsList) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            updated_at: new Date()
          })
          .where(eq(products.id, item.product_id));
      }

      // Delete sale items
      await tx
        .delete(saleItems)
        .where(eq(saleItems.sale_id, parseInt(id)));

      // Delete sale
      await tx
        .delete(sales)
        .where(eq(sales.id, parseInt(id)));
    });

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

export default router;