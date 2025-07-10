import Supplier from "../src/models/Supplier.js";

export async function seedSuppliers() {
  try {
    await Supplier.destroy({ where: {} });
    console.log("Cleared existing suppliers");

    await Supplier.bulkCreate([
      {
        name: "Tech Supplies Ltd",
        email: "info@techsupplies.co.ke",
        phone: "+254700000100",
        address: "123 Industrial Area, Nairobi",
        contact_person: "John Kamau",
      },
      {
        name: "Office Solutions Kenya",
        email: "sales@officesolutions.co.ke",
        phone: "+254700000101",
        address: "456 Westlands, Nairobi",
        contact_person: "Sarah Wanjiku",
      },
      {
        name: "Global Electronics",
        email: "contact@globalelectronics.co.ke",
        phone: "+254700000102",
        address: "789 Mombasa Road, Nairobi",
        contact_person: "David Ochieng",
      },
      {
        name: "Premium Stationery",
        email: "orders@premiumstationery.co.ke",
        phone: "+254700000103",
        address: "321 CBD, Nairobi",
        contact_person: "Grace Akinyi",
      },
      {
        name: "Digital World Kenya",
        email: "support@digitalworld.co.ke",
        phone: "+254700000104",
        address: "654 Thika Road, Nairobi",
        contact_person: "Michael Njoroge",
      },
    ]);

    console.log("Suppliers seeded successfully");
  } catch (error) {
    console.error("Error seeding suppliers:", error);
    throw error;
  }
} 