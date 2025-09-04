import { User } from "../models/index.js";

(async function clearCustomers() {
  try {
    await User.destroy({ where: { role: "client" } });
    console.log("Cleared client users");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
