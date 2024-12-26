import { Router } from 'express';
import { db } from '../src/db';
import { purchaseOrders, purchaseOrderItems } from '../src/db/schema/purchase-order/schema';
import { suppliers } from '../src/db/schema/supplier/schema';
import { products } from '../src/db/schema/product/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Define the purchase order item schema for validation
const purchaseOrderItemSchema = z.object({
  product_id: z.number(),
  unit_type: z.string(),
  quantity: z.number(),
  unit_price: z.string(),
  total_amount: z.string()
});

// Define the purchase order schema for validation
const purchaseOrderSchema = z.object({
  supplier_id: z.number(),
  items: z.array(purchaseOrderItemSchema),
  total_amount: z.string(),
  payment_method: z.enum(['cash', 'card', 'mobile_money']),
  payment_status: z.enum(['paid', 'pending', 'cancelled']),
  order_status: z.enum(['pending', 'received', 'cancelled']),
  notes: z.string().optional()
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const allPurchaseOrders = await db
      .select({
        id: purchaseOrders.id,
        supplier_id: purchaseOrders.supplier_id,
        total_amount: purchaseOrders.total_amount,
        payment_method: purchaseOrders.payment_method,
        payment_status: purchaseOrders.payment_status,
        order_status: purchaseOrders.order_status,
        notes: purchaseOrders.notes,
        created_at: purchaseOrders.created_at,
        updated_at: purchaseOrders.updated_at,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          phone: suppliers.phone,
          email: suppliers.email
        }
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplier_id, suppliers.id))
      .orderBy(desc(purchaseOrders.created_at));

    const purchaseOrdersWithItems = await Promise.all(
      allPurchaseOrders.map(async (order) => {
        const items = await db
          .select({
            id: purchaseOrderItems.id,
            purchase_order_id: purchaseOrderItems.purchase_order_id,
            product_id: purchaseOrderItems.product_id,
            unit_type: purchaseOrderItems.unit_type,
            quantity: purchaseOrderItems.quantity,
            unit_price: purchaseOrderItems.unit_price,
            total_amount: purchaseOrderItems.total_amount,
            product: {
              id: products.id,
              name: products.name,
              sku: products.sku
            }
          })
          .from(purchaseOrderItems)
          .leftJoin(products, eq(purchaseOrderItems.product_id, products.id))
          .where(eq(purchaseOrderItems.purchase_order_id, order.id));

        return {
          ...order,
          items
        };
      })
    );

    res.json(purchaseOrdersWithItems);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Get a single purchase order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await db
      .select({
        id: purchaseOrders.id,
        supplier_id: purchaseOrders.supplier_id,
        total_amount: purchaseOrders.total_amount,
        payment_method: purchaseOrders.payment_method,
        payment_status: purchaseOrders.payment_status,
        order_status: purchaseOrders.order_status,
        notes: purchaseOrders.notes,
        created_at: purchaseOrders.created_at,
        updated_at: purchaseOrders.updated_at,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          phone: suppliers.phone,
          email: suppliers.email
        }
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplier_id, suppliers.id))
      .where(eq(purchaseOrders.id, parseInt(id)))
      .limit(1);

    if (!purchaseOrder.length) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const items = await db
      .select({
        id: purchaseOrderItems.id,
        purchase_order_id: purchaseOrderItems.purchase_order_id,
        product_id: purchaseOrderItems.product_id,
        unit_type: purchaseOrderItems.unit_type,
        quantity: purchaseOrderItems.quantity,
        unit_price: purchaseOrderItems.unit_price,
        total_amount: purchaseOrderItems.total_amount,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku
        }
      })
      .from(purchaseOrderItems)
      .leftJoin(products, eq(purchaseOrderItems.product_id, products.id))
      .where(eq(purchaseOrderItems.purchase_order_id, parseInt(id)));

    res.json({
      ...purchaseOrder[0],
      items
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// Create a new purchase order
router.post('/', async (req, res) => {
  try {
    const validatedData = purchaseOrderSchema.parse(req.body) as PurchaseOrderFormData;

    await db.transaction(async (tx) => {
      // Create the purchase order
      const [newPurchaseOrder] = await tx
        .insert(purchaseOrders)
        .values({
          supplier_id: validatedData.supplier_id,
          total_amount: validatedData.total_amount,
          payment_method: validatedData.payment_method,
          payment_status: validatedData.payment_status,
          order_status: validatedData.order_status,
          notes: validatedData.notes || ''
        })
        .returning();

      // Create purchase order items
      const purchaseOrderItemsData = validatedData.items.map((item) => ({
        purchase_order_id: newPurchaseOrder.id,
        product_id: item.product_id,
        unit_type: item.unit_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount
      }));

      await tx.insert(purchaseOrderItems).values(purchaseOrderItemsData);
    });

    res.status(201).json({ message: 'Purchase order created successfully' });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(400).json({ error: 'Failed to create purchase order' });
  }
});

// Update a purchase order's status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    if (!['pending', 'received', 'cancelled'].includes(order_status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    await db.transaction(async (tx) => {
      // Update purchase order status
      const [updatedPurchaseOrder] = await tx
        .update(purchaseOrders)
        .set({
          order_status,
          updated_at: new Date()
        })
        .where(eq(purchaseOrders.id, parseInt(id)))
        .returning();

      if (!updatedPurchaseOrder) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }

      // If order is received, update product stock
      if (order_status === 'received') {
        const items = await tx
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.purchase_order_id, parseInt(id)));

        for (const item of items) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              updated_at: new Date()
            })
            .where(eq(products.id, item.product_id));
        }
      }
    });

    res.json({ message: 'Purchase order status updated successfully' });
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ error: 'Failed to update purchase order status' });
  }
});

// Delete a purchase order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.transaction(async (tx) => {
      // Delete purchase order items
      await tx
        .delete(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchase_order_id, parseInt(id)));

      // Delete purchase order
      const [deletedPurchaseOrder] = await tx
        .delete(purchaseOrders)
        .where(eq(purchaseOrders.id, parseInt(id)))
        .returning();

      if (!deletedPurchaseOrder) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }
    });

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

export default router; 