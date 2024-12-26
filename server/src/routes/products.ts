import { Router } from 'express';
import Product from '../models/Product';
import PriceUnit from '../models/PriceUnit';
import Supplier from '../models/Supplier';
import ProductSupplier from '../models/ProductSupplier';
import { Op } from 'sequelize';
import upload from '../middleware/upload';
import cloudinary from '../config/cloudinary';

const router = Router();

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'products',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
}

// Get all products
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all products...');
    const products = await Product.findAll({
      include: [
        {
          model: PriceUnit,
          as: 'price_units'
        },
        {
          model: Supplier,
          through: ProductSupplier,
        }
      ]
    });
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      message: 'Error fetching products', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Search products
router.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { sku: { [Op.iLike]: `%${query}%` } },
          { category: { [Op.iLike]: `%${query}%` } }
        ]
      },
      include: [
        {
          model: PriceUnit,
          as: 'price_units'
        },
        {
          model: Supplier,
          through: ProductSupplier,
        }
      ]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error searching products', error });
  }
});

// Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: PriceUnit,
          as: 'price_units'
        },
        {
          model: Supplier,
          through: ProductSupplier,
        }
      ]
    });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error });
  }
});

// Create a new product
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { price_units, ...productData } = req.body;
    
    // Upload image if provided
    let image_url = null;
    if (req.file) {
      image_url = await uploadToCloudinary(req.file);
    }
    
    const product = await Product.create({
      ...productData,
      image_url
    });
    
    if (price_units && price_units.length > 0) {
      const priceUnitsWithProductId = price_units.map(unit => ({
        ...unit,
        product_id: product.id
      }));
      await PriceUnit.bulkCreate(priceUnitsWithProductId);
    }

    const productWithPriceUnits = await Product.findByPk(product.id, {
      include: [
        {
          model: PriceUnit,
          as: 'price_units'
        }
      ]
    });

    res.status(201).json(productWithPriceUnits);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error });
  }
});

// Update a product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { price_units, ...productData } = req.body;
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Upload new image if provided
    if (req.file) {
      const image_url = await uploadToCloudinary(req.file);
      productData.image_url = image_url;
    }

    await product.update(productData);

    if (price_units && price_units.length > 0) {
      // Delete existing price units
      await PriceUnit.destroy({
        where: { product_id: product.id }
      });

      // Create new price units
      const priceUnitsWithProductId = price_units.map(unit => ({
        ...unit,
        product_id: product.id
      }));
      await PriceUnit.bulkCreate(priceUnitsWithProductId);
    }

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: PriceUnit,
          as: 'price_units'
        },
        {
          model: Supplier,
          through: ProductSupplier,
        }
      ]
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) {
      // Delete image from Cloudinary if exists
      if (product.image_url) {
        const publicId = product.image_url.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        }
      }

      await PriceUnit.destroy({
        where: { product_id: product.id }
      });
      await product.destroy();
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error });
  }
});

export default router; 