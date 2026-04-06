const Customer = require("../src/models/Customer");

const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Shaurya", "Atharva", "Advik", "Pranav", "Advait", "Dhruv", "Kabir", "Ritvik", "Aarush", "Kian",
  "Ananya", "Diya", "Aanya", "Pari", "Aadhya", "Myra", "Saanvi", "Ira", "Priya", "Kavya",
  "Nisha", "Divya", "Pooja", "Shreya", "Riya", "Sneha", "Megha", "Tanya", "Neha", "Ankita",
  "Rohan", "Rahul", "Nikhil", "Amit", "Vikram", "Suresh", "Rajesh", "Sanjay", "Deepak", "Manish",
];
const lastNames = [
  "Sharma", "Verma", "Patel", "Singh", "Kumar", "Gupta", "Mehta", "Joshi", "Rao", "Nair",
  "Reddy", "Iyer", "Menon", "Pillai", "Bose", "Das", "Chatterjee", "Mukherjee", "Ghosh", "Sen",
  "Agarwal", "Jain", "Kapoor", "Malhotra", "Khanna", "Bajaj", "Bansal", "Saxena", "Sinha", "Tiwari",
];

const segments = ["Enterprise", "Mid-Market", "SMB", "Consumer"];
const regions = ["North", "South", "East", "West"];

// Regional weights: South and West ~30% more customers than North/East
const regionWeights = [
  ...Array(18).fill("North"),
  ...Array(24).fill("South"),
  ...Array(18).fill("East"),
  ...Array(24).fill("West"),
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEmail(name, index) {
  const providers = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com"];
  const slug = name.toLowerCase().replace(/\s+/g, ".") + index;
  return `${slug}@${pickRandom(providers)}`;
}

async function seedCustomers() {
  await Customer.deleteMany({});

  const customers = [];
  const usedEmails = new Set();

  for (let i = 0; i < 200; i++) {
    const first = pickRandom(firstNames);
    const last = pickRandom(lastNames);
    const name = `${first} ${last}`;
    let email = generateEmail(name, i);
    // Ensure uniqueness
    while (usedEmails.has(email)) {
      email = generateEmail(name, i + Math.floor(Math.random() * 1000));
    }
    usedEmails.add(email);

    customers.push({
      name,
      email,
      segment: pickRandom(segments),
      region: pickRandom(regionWeights),
      signup_date: randomDate(new Date("2023-01-01"), new Date("2025-12-31")),
    });
  }

  const inserted = await Customer.insertMany(customers);
  console.log(`  Seeded ${inserted.length} customers`);
  return inserted;
}

module.exports = seedCustomers;
