import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'products');

// Sample base64 encoded images (placeholder images for products)
const sampleImages = {
  'rice.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...',
  'sugar.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...',
  'cooking-oil.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...',
  'maize-flour.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...',
  'milk.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...',
  'bread.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...',
  'eggs.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...',
  'tea.jpg': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...'
};

function ensureImagesDirectory() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

function createPlaceholderImage(productName: string) {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');

  // Create a colored rectangle with a consistent color based on product name
  const hash = productName.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const color = `hsl(${hash % 360}, 70%, 60%)`;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 200, 200);

  // Add product name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(productName, 100, 100);

  return canvas;
}

function base64ToImage(base64Data: string, filePath: string, productName: string) {
  try {
    // For development, if no base64 data, create a colored rectangle as placeholder
    if (!base64Data || base64Data.endsWith('...')) {
      const canvas = createPlaceholderImage(productName);
      const buffer = canvas.toBuffer('image/jpeg');
      fs.writeFileSync(filePath, buffer);
      return;
    }

    // Remove the data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(filePath, imageBuffer);
  } catch (error) {
    console.error(`Error creating image ${filePath}:`, error);
    // Create a placeholder image on error
    const canvas = createPlaceholderImage(productName);
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(filePath, buffer);
  }
}

export function setupProductImages() {
  try {
    ensureImagesDirectory();

    // Save sample images
    Object.entries(sampleImages).forEach(([filename, base64Data]) => {
      const filePath = path.join(IMAGES_DIR, filename);
      const productName = path.basename(filename, '.jpg').split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      if (!fs.existsSync(filePath)) {
        base64ToImage(base64Data, filePath, productName);
      }
    });

    console.log('Product images setup completed successfully');
  } catch (error) {
    console.error('Error setting up product images:', error);
    throw error;
  }
} 