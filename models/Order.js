const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedVariant: { type: Object, default: {} }, // e.g. { Size: "M", Color: "Red" }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null = guest order
    guestInfo: {
      name: String,
      phone: String,
      email: String,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullAddress: { type: String, required: true },
      city: { type: String, required: true },
      area: String,
      phone: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ["cod", "bkash"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    bkashTransactionId: { type: String, default: null },
    itemsTotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 60 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        note: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
    // Placeholder fields ready for later Steadfast courier integration
    courier: { type: String, default: null },
    trackingId: { type: String, default: null },
    adminNote: { type: String, default: "" },
    isSeenByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
