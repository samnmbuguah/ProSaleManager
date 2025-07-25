import { sequelize } from "../config/database.js";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await sequelize.query(
      `
      INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
      VALUES (
        'admin@prosale.com',
        :password,
        'Admin User',
        'admin',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE
      SET password = :password,
          updated_at = NOW()
    `,
      {
        replacements: { password: hashedPassword },
      },
    );

    console.log("Admin user seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
