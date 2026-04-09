require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose  = require("mongoose");
const Order     = require("../src/models/Order");
const Customer  = require("../src/models/Customer");
const Product   = require("../src/models/Product");
const seedProducts  = require("./seedProducts");
const seedCustomers = require("./seedCustomers");
const seedOrders    = require("./seedOrders");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  await Promise.all([Order.deleteMany({}), Customer.deleteMany({}), Product.deleteMany({})]);
  console.log("Cleared existing data");

  const products  = await seedProducts();
  const customers = await seedCustomers();
  await seedOrders(customers, products);

  console.log("Seeding complete!");
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
