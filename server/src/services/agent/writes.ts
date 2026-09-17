import { z } from "zod";
import { Op } from "sequelize";
import {
  AgentAction,
  Expense,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  StockLog,
  Supplier,
  User,
  sequelize,
} from "../../models/index.js";
import type { AgentActionStatus } from "../../models/AgentAction.js";
import { generateOrderNumber } from "../../utils/helpers.js";
import { calculateWeightedAveragePricesForAllUnits } from "../../utils/priceCalculations.js";
import { createNotificationsForUsers } from "../notification.service.js";

export type WriteActionName = "create_expense" | "draft_purchase_order" | "receive_stock";

/**
 * Role gates mirror the REST endpoints: expense/PO creation has no endpoint
 * role gate (any staff), stock receipt is admin/super_admin only, and clients
 * never get write proposals.
 */
export const WRITE_ROLES: Record<WriteActionName, string[]> = {
  create_expense: ["admin", "manager", "super_admin", "sales"],
  draft_purchase_order: ["admin", "manager", "super_admin", "sales"],
  receive_stock: ["admin", "super_admin"],
};

export function canPerformWrite(action: WriteActionName, role: string): boolean {
  return (WRITE_ROLES[action] ?? []).includes(role);
}

export interface WriteContext {
  storeId: number | null;
  userId: number;
  role: string;
}

export const expenseArgsSchema = z.object({
  description: z.string().trim().min(1).max(500),
  amount: z.number().positive(),
  category: z.string().trim().min(1).max(100),
  payment_method: z.string().trim().max(50).default("cash"),
  date: z.string().optional(),
});

const purchaseOrderItemSchema = z.object({
  product_id: z.number().int().positive(),
  product_name: z.string().optional(),
  quantity: z.number().positive(),
  unit_type: z.enum(["piece", "pack", "dozen"]).default("piece"),
  unit_price: z.number().nonnegative(),
  selling_price: z.number().nonnegative(),
});

export const purchaseOrderArgsSchema = z.object({
  supplier_id: z.number().int().positive(),
  supplier_name: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: purchaseOrderItemSchema.array().min(1).max(50),
});

export const receiveStockArgsSchema = z.object({
  product_id: z.number().int().positive(),
  product_name: z.string().optional(),
  quantity: z.number().positive(),
  unit_type: z.enum(["piece", "pack", "dozen"]).default("piece"),
  buying_price: z.number().nonnegative(),
  selling_price: z.number().nonnegative(),
  notes: z.string().max(500).optional(),
});

export type ExpenseArgs = z.infer<typeof expenseArgsSchema>;
export type PurchaseOrderArgs = z.infer<typeof purchaseOrderArgsSchema>;
export type ReceiveStockArgs = z.infer<typeof receiveStockArgsSchema>;

/**
 * Write implementations. Each mirrors its REST counterpart (same models,
 * same transactional guarantees) so agent writes behave exactly like UI
 * writes. Kept on a mutable registry so tests can substitute fakes.
 */
export const agentWriters = {
  async createExpense(args: ExpenseArgs, ctx: WriteContext): Promise<{ id: number }> {
    if (ctx.storeId == null) throw new Error("Store context missing");
    const expense = await Expense.create({
      description: args.description,
      amount: args.amount,
      date: args.date ? new Date(args.date) : new Date(),
      category: args.category,
      payment_method: args.payment_method,
      user_id: ctx.userId,
      store_id: ctx.storeId,
    });
    return { id: expense.id };
  },

  async createPurchaseOrder(
    args: PurchaseOrderArgs,
    ctx: WriteContext,
  ): Promise<{ id: number; order_number: string }> {
    if (ctx.storeId == null) throw new Error("Store context missing");
    const total = args.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
      0,
    );
    const t = await sequelize.transaction();
    try {
      const order = await PurchaseOrder.create(
        {
          supplier_id: args.supplier_id,
          order_number: generateOrderNumber(),
          order_date: new Date(),
          expected_delivery_date: args.expected_delivery_date
            ? new Date(args.expected_delivery_date)
            : null,
          notes: args.notes ?? null,
          total_amount: total,
          status: "pending",
          store_id: ctx.storeId,
        },
        { transaction: t },
      );
      for (const item of args.items) {
        await PurchaseOrderItem.create(
          {
            purchase_order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            selling_price: item.selling_price,
            total_price: Number(item.quantity) * Number(item.unit_price),
            unit_type: item.unit_type,
            store_id: ctx.storeId,
          },
          { transaction: t },
        );
      }
      await t.commit();
      return { id: order.id, order_number: order.order_number as string };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async receiveStock(
    args: ReceiveStockArgs,
    ctx: WriteContext,
  ): Promise<{ product_id: number; new_quantity: number }> {
    if (ctx.storeId == null) throw new Error("Store context missing");
    const t = await sequelize.transaction();
    try {
      const product = await Product.findByPk(args.product_id, { transaction: t });
      if (!product) throw new Error("Product not found");
      if (Number(product.store_id) !== Number(ctx.storeId) && ctx.role !== "super_admin") {
        throw new Error("Product belongs to a different store");
      }

      const quantityInPieces =
        args.unit_type === "pack"
          ? Number(args.quantity) * 3
          : args.unit_type === "dozen"
            ? Number(args.quantity) * 12
            : Number(args.quantity);

      const weighted = calculateWeightedAveragePricesForAllUnits(
        Number(product.quantity),
        Number(product.piece_buying_price),
        Number(args.quantity),
        Number(args.buying_price),
        args.unit_type,
      );

      product.quantity += quantityInPieces;
      product.updatePrices(args.unit_type, weighted.piece_buying_price, Number(args.selling_price));
      await product.save({ transaction: t });

      await StockLog.create(
        {
          product_id: args.product_id,
          quantity_added: quantityInPieces,
          unit_cost: Number(args.buying_price) / (quantityInPieces / Number(args.quantity)),
          total_cost: Number(args.buying_price) * Number(args.quantity),
          user_id: ctx.userId,
          store_id: ctx.storeId,
          type: "manual_receive",
          notes: args.notes || `Received ${args.quantity} ${args.unit_type}(s) via assistant`,
          date: new Date(),
        },
        { transaction: t },
      );

      await t.commit();
      return { product_id: args.product_id, new_quantity: Number(product.quantity) };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};

export interface AgentAuditEntry {
  threadId: string;
  userId: number;
  storeId: number | null;
  action: string;
  args: Record<string, unknown>;
  summary: string;
  status: AgentActionStatus;
  decidedBy?: number | null;
}

/** Audit trail: every proposal and every decision is recorded. */
export const agentAudit = {
  async record(entry: AgentAuditEntry): Promise<void> {
    await AgentAction.create({
      thread_id: entry.threadId,
      user_id: entry.userId,
      store_id: entry.storeId,
      action: entry.action,
      args: entry.args,
      summary: entry.summary,
      status: entry.status,
      decided_by: entry.decidedBy ?? null,
    });
  },
};

/** Notify store approvers (admins/managers/super admins) of a new proposal. */
export const agentNotify = {
  async proposal(storeId: number | null, title: string, message: string): Promise<void> {
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { role: { [Op.in]: ["admin", "manager"] }, store_id: storeId ?? null },
          { role: "super_admin" },
        ],
      },
      attributes: ["id"],
    });
    const ids = Array.from(new Set(users.map((u) => u.id)));
    if (ids.length > 0) {
      await createNotificationsForUsers(ids, {
        title,
        message,
        type: "system",
        data: { link: "/sales" },
      });
    }
  },
};

/** Name resolution for proposals. Overridable in tests. */
export const agentResolvers = {
  async getProductPricing(product_id: number): Promise<{
    name: string;
    store_id: number | null;
    piece_buying_price: number;
    pack_buying_price: number;
    dozen_buying_price: number;
    piece_selling_price: number;
    pack_selling_price: number;
    dozen_selling_price: number;
  }> {
    const product = await Product.findByPk(product_id);
    if (!product) throw new Error("Product not found");
    const row = product.toJSON() as {
      name: string;
      store_id: number | null;
      piece_buying_price: number | string;
      pack_buying_price: number | string;
      dozen_buying_price: number | string;
      piece_selling_price: number | string;
      pack_selling_price: number | string;
      dozen_selling_price: number | string;
    };
    return {
      name: row.name,
      store_id: row.store_id,
      piece_buying_price: Number(row.piece_buying_price),
      pack_buying_price: Number(row.pack_buying_price),
      dozen_buying_price: Number(row.dozen_buying_price),
      piece_selling_price: Number(row.piece_selling_price),
      pack_selling_price: Number(row.pack_selling_price),
      dozen_selling_price: Number(row.dozen_selling_price),
    };
  },
  async findSuppliers(
    storeId: number | null,
    name: string,
  ): Promise<Array<{ id: number; name: string }>> {
    const where: Record<string, unknown> =
      storeId == null ? {} : { store_id: storeId };
    const suppliers = await Supplier.findAll({
      where: { ...where, name: { [Op.like]: `%${name}%` } },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      limit: 5,
    });
    return suppliers.map((s) => ({ id: s.id, name: s.name }));
  },
};
