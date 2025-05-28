import Product from "../src/models/Product.js";

export async function seedProducts() {
  try {
    // Clear existing products
    await Product.destroy({ where: {} });

    // Create sample products
    // Shoes
    await Product.create({
      name: "Nike Air Max",
      product_code: "SHOE001",
      category: "Shoes",
      stock_unit: "piece",
      quantity: 20,
      min_stock: 5,
      buying_price: 4500,
      selling_price: 6000,
    });

    await Product.create({
      name: "Adidas Ultraboost",
      product_code: "SHOE002",
      category: "Shoes",
      stock_unit: "piece",
      quantity: 15,
      min_stock: 5,
      buying_price: 5000,
      selling_price: 7000,
    });

    // Panties
    await Product.create({
      name: "Victoria Secret Pink Panty",
      product_code: "PAN001",
      category: "Panties",
      stock_unit: "dozen",
      quantity: 10,
      min_stock: 3,
      buying_price: 3600,
      selling_price: 4800,
    });

    await Product.create({
      name: "Cotton Hipster Panty",
      product_code: "PAN002",
      category: "Panties",
      stock_unit: "pack",
      quantity: 20,
      min_stock: 5,
      buying_price: 1500,
      selling_price: 2100,
    });

    // Boxers
    await Product.create({
      name: "Calvin Klein Boxer Brief",
      product_code: "BOX001",
      category: "Boxers",
      stock_unit: "pack",
      quantity: 15,
      min_stock: 5,
      buying_price: 2400,
      selling_price: 3000,
    });

    await Product.create({
      name: "Nike Dri-FIT Boxer",
      product_code: "BOX002",
      category: "Boxers",
      stock_unit: "dozen",
      quantity: 8,
      min_stock: 2,
      buying_price: 4800,
      selling_price: 6000,
    });

    // Bras
    await Product.create({
      name: "Victoria Secret Push-Up Bra",
      product_code: "BRA001",
      category: "Bras",
      stock_unit: "piece",
      quantity: 30,
      min_stock: 10,
      buying_price: 1500,
      selling_price: 2500,
    });

    await Product.create({
      name: "Sports Bra",
      product_code: "BRA002",
      category: "Bras",
      stock_unit: "pack",
      quantity: 12,
      min_stock: 4,
      buying_price: 1800,
      selling_price: 2400,
    });

    // Oil
    await Product.create({
      name: "Coconut Oil",
      product_code: "OIL001",
      category: "Oil",
      stock_unit: "dozen",
      quantity: 5,
      min_stock: 2,
      buying_price: 3600,
      selling_price: 4800,
    });

    await Product.create({
      name: "Olive Oil",
      product_code: "OIL002",
      category: "Oil",
      stock_unit: "piece",
      quantity: 25,
      min_stock: 8,
      buying_price: 350,
      selling_price: 450,
    });

    console.log("Products seeded successfully");
  } catch (error) {
    console.error("Error seeding products:", error);
  }
}
