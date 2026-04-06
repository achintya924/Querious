const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
console.log("MONGO_URI loaded:", !!process.env.MONGO_URI);
const mongoose = require("mongoose");

const seedProducts  = require("./seedProducts");
const seedCustomers = require("./seedCustomers");
const seedOrders    = require("./seedOrders");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Error: MONGO_URI is not set. Copy server/.env.example to server/.env and fill it in.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.\n");

  console.log("Seeding products...");
  const products = await seedProducts();

  console.log("Seeding customers...");
  const customers = await seedCustomers();

  console.log("Seeding orders...");
  await seedOrders(customers, products);

  console.log("\nAll seeds complete.");
  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
