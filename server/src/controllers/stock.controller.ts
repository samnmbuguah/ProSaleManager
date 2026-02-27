import { Request, Response } from "express";
import { sequelize, Product, User } from "../models/index.js";
import StockLog from "../models/StockLog.js";
import { Op } from "sequelize";

export const receiveStock = async (req: Request, res: Response) => {
    let t;
    try {
        const {
            product_id,
            quantity,
            unit_type, // 'piece', 'pack', 'dozen'
            buying_price,
            selling_price,
            notes
        } = req.body;

        // Validation
        if (!product_id || !quantity || !unit_type || !buying_price || !selling_price) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const store_id = req.user?.role === "super_admin" ? (req.body.store_id || req.user?.store_id) : req.user?.store_id;
        if (req.user?.role !== "super_admin" && !store_id) {
            return res.status(400).json({ message: "Store context missing" });
        }

        t = await sequelize.transaction();

        const product = await Product.findByPk(product_id, { transaction: t });
        if (!product) {
            await t.rollback();
            return res.status(404).json({ message: "Product not found" });
        }

        // Calculate quantity in pieces based on unit_type
        let quantityInPieces = Number(quantity);
        if (unit_type === "pack") {
            quantityInPieces = Number(quantity) * 3;
        } else if (unit_type === "dozen") {
            quantityInPieces = Number(quantity) * 12;
        }

        // Update product quantity and prices
        product.quantity += quantityInPieces;

        // Update prices using the instance method
        await product.updatePrices(unit_type, Number(buying_price), Number(selling_price));

        // Explicitly save the updated quantity (updatePrices saves prices, but let's ensure quantity is saved)
        await product.save({ transaction: t });

        // Create StockLog entry
        const total_cost = Number(buying_price) * Number(quantity);

        await StockLog.create({
            product_id,
            quantity_added: quantityInPieces, // Log base units or entered units? Let's log base units for consistency or add a unit_type field to log. 
            // Using pieces for now to match product.quantity logic, but calculating cost based on entry.
            // Actually, let's stick to base units for quantity_added to align with product.quantity.
            unit_cost: Number(buying_price) / (quantityInPieces / Number(quantity)), // Cost per piece
            total_cost: total_cost,
            user_id,
            store_id,
            type: "manual_receive",
            notes: notes || `Received ${quantity} ${unit_type}(s)`,
            date: new Date()
        }, { transaction: t });

        await t.commit();

        res.status(200).json({
            message: "Stock received successfully",
            product: {
                id: product.id,
                name: product.name,
                new_quantity: product.quantity,
                prices: {
                    piece_buying: product.piece_buying_price,
                    piece_selling: product.piece_selling_price
                }
            }
        });

    } catch (error: any) {
        if (t) await t.rollback();
        console.error("Receive stock error:", error);
        res.status(500).json({ message: "Failed to receive stock", error: error.message });
    }
};

export const receiveStockBulk = async (req: Request, res: Response) => {
    let t;
    try {
        const { items, store_id: bodyStoreId } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No items provided" });
        }

        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        // Determine store_id (Super Admin can specify, others use their assigned store)
        const store_id = req.user?.role === "super_admin" ? (bodyStoreId || req.user?.store_id) : req.user?.store_id;

        if (req.user?.role !== "super_admin" && !store_id) {
            return res.status(400).json({ message: "Store context missing" });
        }

        t = await sequelize.transaction();
        const results = [];

        for (const item of items) {
            const {
                product_id,
                quantity,
                unit_type, // 'piece', 'pack', 'dozen'
                buying_price,
                selling_price,
                notes
            } = item;

            if (!product_id || !quantity || !unit_type || buying_price === undefined || selling_price === undefined) {
                // Skip invalid items or throw? Let's throw to fail the whole batch for safety
                throw new Error(`Missing required fields for product ID ${product_id || 'unknown'}`);
            }

            const product = await Product.findByPk(product_id, { transaction: t });
            if (!product) {
                throw new Error(`Product with ID ${product_id} not found`);
            }

            // Calculate quantity in pieces based on unit_type
            let quantityInPieces = Number(quantity);
            if (unit_type === "pack") {
                quantityInPieces = Number(quantity) * 3;
            } else if (unit_type === "dozen") {
                quantityInPieces = Number(quantity) * 12;
            }

            // Update product quantity
            product.quantity += quantityInPieces;

            // Update prices using the instance method
            await product.updatePrices(unit_type, Number(buying_price), Number(selling_price));

            // Explicitly save
            await product.save({ transaction: t });

            // Create StockLog entry
            const total_cost = Number(buying_price) * Number(quantity);
            const unit_cost = Number(buying_price) / (quantityInPieces / Number(quantity));

            await StockLog.create({
                product_id,
                quantity_added: quantityInPieces,
                unit_cost: unit_cost,
                total_cost: total_cost,
                user_id,
                store_id, // Use the resolved store_id
                type: "manual_receive",
                notes: notes || `Bulk Receive: ${quantity} ${unit_type}(s)`,
                date: new Date()
            }, { transaction: t });

            results.push({
                id: product.id,
                name: product.name,
                new_quantity: product.quantity
            });
        }

        await t.commit();

        res.status(200).json({
            message: "Stock received successfully",
            count: results.length,
            items: results
        });

    } catch (error: any) {
        if (t) await t.rollback();
        console.error("Bulk receive stock error:", error);
        res.status(500).json({ message: error.message || "Failed to receive stock" });
    }
};

export const getStockValueReport = async (req: Request, res: Response) => {
    try {
        const { start_date, end_date } = req.query;
        const store_id = req.user?.role === "super_admin" ? (req.query.store_id || req.user?.store_id) : req.user?.store_id;

        const whereClause: any = {};

        if (store_id) {
            whereClause.store_id = store_id;
        }

        if (start_date && end_date) {
            whereClause.date = {
                [Op.between]: [new Date(start_date as string), new Date(end_date as string)]
            };
        }

        const logs = await StockLog.findAll({
            where: whereClause,
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["name", "sku"]
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["name"]
                }
            ],
            order: [["date", "DESC"]]
        });

        const totalValue = logs.reduce((sum, log) => sum + Number(log.total_cost), 0);
        const totalQuantity = logs.reduce((sum, log) => sum + Number(log.quantity_added), 0);

        // Group by day for trend analysis
        const byDayMap = new Map<string, { date: string; value: number; quantity: number }>();
        // Group by product for performance analysis
        const productMap = new Map<string, { id: number; name: string; sku: string; value: number; quantity: number }>();

        logs.forEach(log => {
            const dateStr = log.date.toISOString().slice(0, 10);
            const val = Number(log.total_cost);
            const qty = Number(log.quantity_added);

            // Daily aggregation
            if (!byDayMap.has(dateStr)) {
                byDayMap.set(dateStr, { date: dateStr, value: 0, quantity: 0 });
            }
            const dayData = byDayMap.get(dateStr)!;
            dayData.value += val;
            dayData.quantity += qty;

            // Product aggregation
            const productId = log.product_id.toString();
            if (!productMap.has(productId)) {
                productMap.set(productId, {
                    id: log.product_id,
                    name: (log as any).product?.name || "Unknown",
                    sku: (log as any).product?.sku || "N/A",
                    value: 0,
                    quantity: 0
                });
            }
            const prodData = productMap.get(productId)!;
            prodData.value += val;
            prodData.quantity += qty;
        });

        const byDay = Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        const topProducts = Array.from(productMap.values()).sort((a, b) => b.value - a.value);

        res.json({
            total_value: totalValue,
            total_quantity: totalQuantity,
            unique_products: productMap.size,
            count: logs.length,
            byDay,
            topProducts,
            logs
        });

    } catch (error: any) {
        console.error("Stock report error:", error);
        res.status(500).json({ message: "Failed to fetch stock value report", error: error.message });
    }
};
