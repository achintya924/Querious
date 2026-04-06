const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  product: { type: String, required: true },
  category: { type: String, required: true },
  region: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["delivered", "shipped", "processing", "cancelled", "returned"],
    required: true,
  },
  order_date: { type: Date, required: true },
});

orderSchema.index({ order_date: 1, region: 1, category: 1 });

module.exports = mongoose.model("Order", orderSchema);
