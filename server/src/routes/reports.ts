import { Router } from 'express'
import Product from '../models/Product.js'
import Sale from '../models/Sale.js'
import SaleItem from '../models/SaleItem.js'
import { Op } from 'sequelize'
import { storeScope } from '../utils/helpers.js'

const router = Router()

// Get inventory status report
router.get('/inventory', async (req, res) => {
  try {
    const where = storeScope(req.user!, { is_active: true });
    const products = await Product.findAll({
      where,
      order: [['name', 'ASC']]
    })

    const inventoryData = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      piece_selling_price: product.piece_selling_price,
      pack_selling_price: product.pack_selling_price,
      dozen_selling_price: product.dozen_selling_price,
      quantity: product.quantity,
      min_quantity: product.min_quantity,
      is_active: product.is_active,
      created_at: product.createdAt,
      updated_at: product.updatedAt
    }))

    const totalValue = inventoryData.reduce((sum, product) => {
      return sum + (product.piece_selling_price || 0) * (product.quantity || 0)
    }, 0)

    res.json({
      success: true,
      data: {
        products: inventoryData,
        totalValue,
        totalProducts: inventoryData.length,
        lowStockProducts: inventoryData.filter(p => (p.quantity || 0) < (p.min_quantity || 10)).length,
        outOfStockProducts: inventoryData.filter(p => (p.quantity || 0) <= 0).length
      }
    })
  } catch (error) {
    console.error('Error fetching inventory report:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory report'
    })
  }
})

// Get product performance report
router.get('/product-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Build date filter
    const dateFilter: Record<string, unknown> = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      }
    }

    // Get sales with items and products
    const sales = await Sale.findAll({
      where: storeScope(req.user!, {
        status: 'completed',
        ...dateFilter
      }),
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    }) as Array<Sale & { items?: Array<SaleItem & { Product?: { name?: string; sku?: string } }> }>;

    // Aggregate product performance data
    const productPerformanceMap = new Map<number, any>();

    sales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const productId = item.product_id;
        const product = item.Product;

        if (!productPerformanceMap.has(productId)) {
          productPerformanceMap.set(productId, {
            productId,
            productName: product?.name || 'Unknown Product',
            productSku: product?.sku || 'N/A',
            quantity: 0,
            revenue: 0,
            profit: 0,
            lastSold: null,
            averagePrice: 0,
            totalSales: 0
          });
        }

        const performance = productPerformanceMap.get(productId);
        const quantity = parseFloat(String(item.quantity)) || 0;
        const total = parseFloat(String(item.total)) || 0;

        performance.quantity += quantity;
        performance.revenue += total;
        performance.totalSales += 1;
        performance.averagePrice = performance.revenue / performance.quantity;

        // Calculate profit (assuming 20% margin for demo)
        const profit = total * 0.2;
        performance.profit += profit;

        // Update last sold date
        const saleDate = new Date(sale.createdAt as Date);
        if (!performance.lastSold || saleDate > new Date(performance.lastSold)) {
          performance.lastSold = saleDate;
        }
      });
    });

    const productPerformance = Array.from(productPerformanceMap.values()) as Array<{
      productId: number;
      productName: string;
      productSku: string;
      quantity: number;
      revenue: number;
      profit: number;
      lastSold: Date | null;
      averagePrice: number;
      totalSales: number;
    }>;
    productPerformance.sort((a, b) => b.revenue - a.revenue);

    // Calculate totals
    const totalRevenue = productPerformance.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = productPerformance.reduce((sum, p) => sum + p.profit, 0);
    const totalQuantity = productPerformance.reduce((sum, p) => sum + p.quantity, 0);

    res.json({
      success: true,
      data: {
        products: productPerformance,
        summary: {
          totalRevenue,
          totalProfit,
          totalQuantity,
          totalProducts: productPerformance.length,
          averageRevenue: totalRevenue / productPerformance.length || 0,
          averageProfit: totalProfit / productPerformance.length || 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching product performance report:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product performance report'
    })
  }
})

// Get sales summary report
router.get('/sales-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Build date filter
    const dateFilter: Record<string, unknown> = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      }
    }

    const sales = await Sale.findAll({
      where: storeScope(req.user!, {
        status: 'completed',
        ...dateFilter
      }),
      include: [
        {
          model: SaleItem,
          as: 'items'
        }
      ]
    }) as Array<Sale & { items?: SaleItem[] }>;

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(String(sale.total_amount || '0')), 0);
    const totalItems = sales.reduce((sum, sale) => sum + ((sale.items?.length) || 0), 0);

    // Group by payment method
    const paymentMethods = sales.reduce((acc, sale) => {
      const method = sale.payment_method || 'unknown'
      acc[method] = (acc[method] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Daily sales for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentSales = await Sale.findAll({
      where: {
        status: 'completed',
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      attributes: [
        [Sale.sequelize!.fn('DATE', Sale.sequelize!.col('createdAt')), 'date'],
        [Sale.sequelize!.fn('SUM', Sale.sequelize!.fn('CAST', Sale.sequelize!.col('total_amount'), 'DECIMAL(10,2)')), 'total']
      ],
      group: [Sale.sequelize!.fn('DATE', Sale.sequelize!.col('createdAt'))],
      order: [[Sale.sequelize!.fn('DATE', Sale.sequelize!.col('createdAt')), 'ASC']]
    })

    res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalRevenue,
          totalItems,
          averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
        },
        paymentMethods,
        dailySales: recentSales.map((sale: { getDataValue: (field: string) => string | number | undefined }) => ({
          date: sale.getDataValue('date'),
          total: parseFloat(String(sale.getDataValue('total') || '0'))
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching sales summary report:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales summary report'
    })
  }
})

export default router 