const Order = require("../src/models/Order");

// Month weights per category to encode seasonal patterns
// Index 0 = Jan, 11 = Dec
const monthWeights = {
  Electronics: [5, 4, 5, 5, 5, 5, 6, 6, 7, 9, 12, 11],  // Spike Oct-Dec (Diwali/holidays)
  Clothing:    [5, 5, 5, 6, 6, 8, 9, 9, 7, 6, 5, 5],     // Spike Jul-Aug (back to school)
  "Home & Kitchen": [6, 5, 6, 7, 7, 7, 7, 7, 8, 8, 8, 8],
  Office:      [7, 7, 8, 8, 8, 7, 7, 8, 9, 8, 7, 6],
};

const statusWeights = [
  ...Array(75).fill("delivered"),
  ...Array(10).fill("shipped"),
  ...Array(8).fill("processing"),
  ...Array(5).fill("cancelled"),
  ...Array(2).fill("returned"),
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedMonthPick(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 11;
}

function randomDayInMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.floor(Math.random() * daysInMonth) + 1;
}

function addNoise(price, pct = 0.05) {
  const noise = 1 + (Math.random() * 2 - 1) * pct;
  return Math.round(price * noise);
}

// Regional weights: South and West ~30% more orders
const regionWeights = [
  ...Array(18).fill("North"),
  ...Array(24).fill("South"),
  ...Array(18).fill("East"),
  ...Array(24).fill("West"),
];

async function seedOrders(customers, products) {
  await Order.deleteMany({});

  const orders = [];
  const TOTAL = 5000;

  // 2024 gets ~43% of orders, 2025 gets ~57% (15% growth)
  // Out of 5000: ~2150 in 2024, ~2850 in 2025
  const yearDistribution = [
    ...Array(2150).fill(2024),
    ...Array(2850).fill(2025),
  ];

  for (let i = 0; i < TOTAL; i++) {
    const product = pickRandom(products);
    const customer = pickRandom(customers);
    const year = yearDistribution[i];
    const weights = monthWeights[product.category];
    const month = weightedMonthPick(weights);
    const day = randomDayInMonth(year, month);
    const order_date = new Date(year, month, day);

    const quantity = Math.floor(Math.random() * 4) + 1;
    const unit_price = addNoise(product.price);
    const total_amount = unit_price * quantity;

    orders.push({
      order_id: `ORD-${String(i + 1).padStart(6, "0")}`,
      customer_id: customer._id,
      product: product.name,
      category: product.category,
      region: pickRandom(regionWeights),
      quantity,
      unit_price,
      total_amount,
      status: pickRandom(statusWeights),
      order_date,
    });
  }

  // Insert in batches of 500
  const BATCH = 500;
  for (let b = 0; b < orders.length; b += BATCH) {
    await Order.insertMany(orders.slice(b, b + BATCH));
  }

  console.log(`  Seeded ${orders.length} orders`);

  // Print quick breakdown
  const byYear = orders.reduce((acc, o) => {
    const y = o.order_date.getFullYear();
    acc[y] = (acc[y] || 0) + 1;
    return acc;
  }, {});
  console.log(`    2024: ${byYear[2024]} orders | 2025: ${byYear[2025]} orders`);

  const byRegion = orders.reduce((acc, o) => {
    acc[o.region] = (acc[o.region] || 0) + 1;
    return acc;
  }, {});
  console.log(`    Regions: N=${byRegion.North} S=${byRegion.South} E=${byRegion.East} W=${byRegion.West}`);
}

module.exports = seedOrders;
