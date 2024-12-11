import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // First, delete all existing products
  await prisma.product.deleteMany({})
  
  // Create new demo products
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Classic White T-Shirt',
        description: 'A comfortable basic white t-shirt made from 100% cotton',
        price: 1999, // $19.99
        image: 'https://example.com/white-tshirt.jpg',
        category: 'Clothing'
      },
      {
        name: 'Leather Wallet',
        description: 'Genuine leather bifold wallet with multiple card slots',
        price: 2999, // $29.99
        image: 'https://example.com/wallet.jpg',
        category: 'Accessories'
      },
      {
        name: 'Running Shoes',
        description: 'Lightweight running shoes with cushioned soles',
        price: 7999, // $79.99
        image: 'https://example.com/running-shoes.jpg',
        category: 'Footwear'
      },
      {
        name: 'Wireless Headphones',
        description: 'Bluetooth headphones with noise cancellation',
        price: 12999, // $129.99
        image: 'https://example.com/headphones.jpg',
        category: 'Electronics'
      }
    ]
  })

  console.log('Database has been seeded with demo products')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 