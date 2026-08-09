const Product = require("../models/Product");

// @desc  Get products with filters, search, pagination
// @route GET /api/products?search=&category=&page=&limit=&topSelling=&combo=
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 12, topSelling, combo, minPrice, maxPrice } = req.query;

    const filter = { isActive: true };
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (topSelling === "true") filter.isTopSelling = true;
    if (combo === "true") filter.isComboOffer = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).populate("category", "name slug").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single product + related products
// @route GET /api/products/:slug
exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate("category", "name slug");
    if (!product) return res.status(404).json({ success: false, message: "প্রোডাক্ট পাওয়া যায়নি" });

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    }).limit(4);

    res.json({ success: true, product, related });
  } catch (err) {
    next(err);
  }
};

// @desc  Create product (admin)
// @route POST /api/admin/products
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc  Update product (admin)
// @route PUT /api/admin/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: "প্রোডাক্ট পাওয়া যায়নি" });
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete product (admin) — soft delete
// @route DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "প্রোডাক্ট পাওয়া যায়নি" });
    res.json({ success: true, message: "প্রোডাক্ট মুছে ফেলা হয়েছে" });
  } catch (err) {
    next(err);
  }
};
