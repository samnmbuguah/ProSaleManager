import { Sequelize } from "sequelize";
import fs from "fs";

// Manually load the database config
const configFile = fs.readFileSync("./src/config/database.js", "utf8");
const config = eval(
  `(${configFile.match(/export default (\{[\s\S]*?\});/)[1]})`,
);

const sequelize = new Sequelize(config.development);

async function checkDeliveryProduct() {
  try {
    console.log("Checking for delivery product...");

    const [results] = await sequelize.query(
      "SELECT * FROM products WHERE product_code = 'SRV001'",
    );

    if (results.length === 0) {
      console.log("Delivery product (SRV001) does NOT exist in the database");
    } else {
      console.log("Delivery product found:");
      console.log(results[0]);
    }
  } catch (error) {
    console.error("Error checking for delivery product:", error);
  } finally {
    await sequelize.close();
  }
}

checkDeliveryProduct();
