import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    category: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
