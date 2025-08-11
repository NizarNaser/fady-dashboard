import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  images: {
    type: [String], // مصفوفة روابط صور
    default: [],
  },
  price: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
  soldAt: { type: Date },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
