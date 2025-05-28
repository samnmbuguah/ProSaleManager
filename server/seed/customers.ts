import Customer from "../src/models/Customer.js";

export async function seedCustomers() {
  try {
    await Customer.destroy({ where: {} });
    console.log("Cleared existing customers");

    await Customer.bulkCreate([
      {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+254700000001",
        address: "123 Main St, Nairobi",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+254700000002",
        address: "456 Riverside, Kisumu",
      },
      {
        name: "Alice Wanjiku",
        email: "alice.wanjiku@example.com",
        phone: "+254700000003",
        address: "789 Kenyatta Ave, Nakuru",
      },
      {
        name: "Peter Otieno",
        email: "peter.otieno@example.com",
        phone: "+254700000004",
        address: "321 Moi Ave, Mombasa",
      },
      {
        name: "Mary Njeri",
        email: "mary.njeri@example.com",
        phone: "+254700000005",
        address: "654 Tom Mboya St, Eldoret",
      },
    ]);

    console.log("Customers seeded successfully");
  } catch (error) {
    console.error("Error seeding customers:", error);
    throw error;
  }
} 