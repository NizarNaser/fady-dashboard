import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
