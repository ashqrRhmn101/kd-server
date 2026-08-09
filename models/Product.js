const mongoose = require("mongoose");
const slugify = require("slugify");

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Size", "Color"
    options: [{ type: String, required: true }], // e.g. ["S","M","L"]
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    images: [{ type: String, required: true }], // 3-4 image URLs
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: null },
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, unique: true, sparse: true },
    variants: [variantSchema],
    isTopSelling: { type: Boolean, default: false },
    isComboOffer: { type: Boolean, default: false },
    comboItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // if this is a combo pack
    soldCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

productSchema.pre("validate", function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + "-" + Date.now().toString(36);
  }
  next();
});

productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice && this.discountPrice < this.price ? this.discountPrice : this.price;
});
productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
