import { Router } from 'express';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier';
import ProductSupplier from '../models/ProductSupplier';
import { Op } from 'sequelize';
import upload from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';

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
    const products = await Product.findAll({
      order: [['name', 'ASC']]
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      message: 'Error fetching products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search products endpoint
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || typeof query !== 'string') {
      return res.json([]);
    }

    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { product_code: { [Op.iLike]: `%${query}%` } },
          { category: { [Op.iLike]: `%${query}%` } }
        ]
      },
      order: [['name', 'ASC']]
    });

    return res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({ 
      message: 'Error searching products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
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
    const productData = req.body;
    
    // Upload image if provided
    let image_url = null;
    if (req.file) {
      image_url = await uploadToCloudinary(req.file);
    }
    
    const product = await Product.create({
      ...productData,
      image_url
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error });
  }
});

// Update a product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const productData = req.body;
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

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
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