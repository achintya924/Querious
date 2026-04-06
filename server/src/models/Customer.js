const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  segment: {
    type: String,
    enum: ["Enterprise", "Mid-Market", "SMB", "Consumer"],
    required: true,
  },
  region: {
    type: String,
    enum: ["North", "South", "East", "West"],
    required: true,
  },
  signup_date: { type: Date, required: true },
});

module.exports = mongoose.model("Customer", customerSchema);
