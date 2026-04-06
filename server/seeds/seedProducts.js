const Product = require("../src/models/Product");

const products = [
  // Electronics
  { name: "ProBook Laptop 15",     category: "Electronics", price: 74999, cost: 42000, stock: 120 },
  { name: "Nova Smartphone X12",   category: "Electronics", price: 34999, cost: 18500, stock: 250 },
  { name: "SlimTab Pro 10",        category: "Electronics", price: 24999, cost: 13000, stock: 180 },
  { name: "SoundWave Headphones",  category: "Electronics", price: 7999,  cost: 3200,  stock: 400 },
  { name: "PulseWatch Series 3",   category: "Electronics", price: 14999, cost: 7500,  stock: 210 },

  // Clothing
  { name: "Alpine Trek Jacket",    category: "Clothing",    price: 3999,  cost: 1400,  stock: 300 },
  { name: "Essential Cotton Tee",  category: "Clothing",    price: 799,   cost: 250,   stock: 1000 },
  { name: "Urban Slim Jeans",      category: "Clothing",    price: 2499,  cost: 900,   stock: 500 },
  { name: "AirStep Sneakers",      category: "Clothing",    price: 4499,  cost: 1700,  stock: 350 },
  { name: "Floret Midi Dress",     category: "Clothing",    price: 2999,  cost: 1100,  stock: 280 },

  // Home & Kitchen
  { name: "PowerBlend Pro 750W",   category: "Home & Kitchen", price: 5499, cost: 2200, stock: 200 },
  { name: "BrewMaster Coffee Pro", category: "Home & Kitchen", price: 8999, cost: 3800, stock: 150 },
  { name: "CleanAir Purifier 360", category: "Home & Kitchen", price: 12999, cost: 5500, stock: 130 },
  { name: "ChefSet Non-Stick 5pc", category: "Home & Kitchen", price: 4999, cost: 2000, stock: 220 },
  { name: "LumiStrip Smart Lights", category: "Home & Kitchen", price: 2499, cost: 950, stock: 400 },

  // Office
  { name: "UltraView 27\" Monitor", category: "Office", price: 22999, cost: 12000, stock: 90 },
  { name: "MechType Pro Keyboard", category: "Office",  price: 6999,  cost: 2800,  stock: 300 },
  { name: "RiseDesk Standing Pro",  category: "Office",  price: 18999, cost: 9500,  stock: 60  },
  { name: "StreamCam 4K Webcam",    category: "Office",  price: 7499,  cost: 3200,  stock: 200 },
  { name: "ErgoChair Lumbar Pro",   category: "Office",  price: 24999, cost: 11000, stock: 75  },
];

async function seedProducts() {
  await Product.deleteMany({});
  const inserted = await Product.insertMany(products);
  console.log(`  Seeded ${inserted.length} products`);
  return inserted;
}

module.exports = seedProducts;
