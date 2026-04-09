import { Request, Response } from "express";
import { sequelize, Product, User, StockReceipt } from "../models/index.js";
import StockLog from "../models/StockLog.js";
import { Op } from "sequelize";
import { calculateWeightedAveragePricesForAllUnits } from "../utils/priceCalculations.js";

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

        // Calculate weighted average prices based on existing stock and new purchase (BEFORE incrementing quantity)
        const weightedPrices = calculateWeightedAveragePricesForAllUnits(
            Number(product.quantity),
            Number(product.piece_buying_price),
            Number(quantity),
            Number(buying_price),
            unit_type
        );

        // Update product quantity and prices
        product.quantity += quantityInPieces;

        // Apply blended prices + selling price via instance method (no save)
        product.updatePrices(unit_type, weightedPrices.piece_buying_price, Number(selling_price));

        // Save all changes (quantity + prices) atomically within the transaction
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

        const store_id = req.user?.role === "super_admin" ? (bodyStoreId || req.user?.store_id) : req.user?.store_id;

        if (req.user?.role !== "super_admin" && !store_id) {
            return res.status(400).json({ message: "Store context missing" });
        }

        // Group items by product_id to handle repeats correctly (e.g. Cap C at different prices)
        const groupedItems = new Map<number, typeof items>();
        for (const item of items) {
            const pid = Number(item.product_id);
            if (!groupedItems.has(pid)) {
                groupedItems.set(pid, []);
            }
            groupedItems.get(pid)!.push(item);
        }

        t = await sequelize.transaction();
        
        // 1. Create the parent StockReceipt record first to get an ID
        let totalOverallCost = 0;
        let totalItemsCount = 0;
        
        // Quick pass to calculate totals for the receipt header
        for (const item of items) {
            totalOverallCost += Number(item.buying_price) * Number(item.quantity);
            totalItemsCount += 1;
        }

        const receipt = await StockReceipt.create({
            user_id,
            store_id,
            total_cost: totalOverallCost,
            items_count: totalItemsCount,
            date: new Date(),
            notes: req.body.notes || `Bulk receive of ${totalItemsCount} products`
        }, { transaction: t });

        const results = [];

        // 2. Process each unique product once
        for (const [product_id, productItems] of groupedItems) {
            const product = await Product.findByPk(product_id, { transaction: t });
            if (!product) {
                throw new Error(`Product with ID ${product_id} not found`);
            }

            // Capture initial state for math
            const initialQuantity = Number(product.quantity);
            const initialPiecePrice = Number(product.piece_buying_price);

            let totalBatchQuantityInPieces = 0;
            let totalBatchCost = 0;
            let finalSellingPrice = -1;
            let finalUnitType: 'piece' | 'pack' | 'dozen' = 'piece';

            // First, process all items in the batch for this product
            for (const item of productItems) {
                const {
                    quantity,
                    unit_type,
                    buying_price,
                    selling_price,
                    notes
                } = item;

                if (!quantity || !unit_type || buying_price === undefined || selling_price === undefined) {
                    throw new Error(`Missing required fields for product ${product.name}`);
                }

                let qInPieces = Number(quantity);
                let multiplier = 1;
                if (unit_type === "pack") {
                    qInPieces = Number(quantity) * 3;
                    multiplier = 3;
                } else if (unit_type === "dozen") {
                    qInPieces = Number(quantity) * 12;
                    multiplier = 12;
                }

                totalBatchQuantityInPieces += qInPieces;
                totalBatchCost += Number(buying_price) * Number(quantity);
                
                // Track the final selling price and its unit type provided in the batch
                finalSellingPrice = Number(selling_price);
                finalUnitType = unit_type as 'piece' | 'pack' | 'dozen';

                // Create individual StockLog entry for this line item
                await StockLog.create({
                    product_id,
                    quantity_added: qInPieces,
                    unit_cost: Number(buying_price) / multiplier,
                    total_cost: Number(buying_price) * Number(quantity),
                    user_id,
                    store_id,
                    receipt_id: receipt.id, // Link to the batch receipt
                    type: "manual_receive",
                    notes: notes || `Bulk Receive: ${quantity} ${unit_type}(s)`,
                    date: new Date()
                }, { transaction: t });
            }

            // Now calculate the actual weighted average price using the TOTAL batch
            const totalQuantityAfterBatch = initialQuantity + totalBatchQuantityInPieces;
            const totalValueAfterBatch = (initialQuantity * initialPiecePrice) + totalBatchCost;
            
            const newPieceBuyingPrice = totalQuantityAfterBatch > 0 
                ? Number((totalValueAfterBatch / totalQuantityAfterBatch).toFixed(5)) 
                : initialPiecePrice;

            // Update product once with the final cumulative values
            product.quantity = totalQuantityAfterBatch;
            
            // Use instance method to update prices safely using the last provided unit type/price
            product.updatePrices(finalUnitType, newPieceBuyingPrice, finalSellingPrice);

            await product.save({ transaction: t });

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

export const getStockReceipts = async (req: Request, res: Response) => {
    try {
        const store_id = req.user?.role === "super_admin" ? (req.query.store_id || req.user?.store_id) : req.user?.store_id;
        
        const receipts = await StockReceipt.findAll({
            where: { store_id },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["name"]
                }
            ],
            order: [["date", "DESC"]],
            limit: 50
        });

        res.json(receipts);
    } catch (error: any) {
        console.error("Error fetching stock receipts:", error);
        res.status(500).json({ message: "Failed to fetch stock receipts" });
    }
};

export const getStockReceiptById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const store_id = req.user?.role === "super_admin" ? (req.query.store_id || req.user?.store_id) : req.user?.store_id;

        const receipt = await StockReceipt.findOne({
            where: { id, store_id },
            include: [
                {
                    model: StockLog,
                    as: "items",
                    include: [
                        {
                            model: Product,
                            as: "product",
                            attributes: ["name", "sku"]
                        }
                    ]
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["name"]
                }
            ]
        });

        if (!receipt) {
            return res.status(404).json({ message: "Stock receipt not found" });
        }

        res.json(receipt);
    } catch (error: any) {
        console.error("Error fetching stock receipt details:", error);
        res.status(500).json({ message: "Failed to fetch stock receipt details" });
    }
};
