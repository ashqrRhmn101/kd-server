const Review = require("../models/Review");
const Product = require("../models/Product");

// @desc  Get approved reviews for a product
// @route GET /api/products/:productId/reviews
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

// @desc  Submit a review (logged-in users only)
// @route POST /api/products/:productId/reviews
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.create({
      product: req.params.productId,
      user: req.user._id,
      name: req.user.name,
      rating,
      comment,
    });
    res.status(201).json({ success: true, review, message: "রিভিউ জমা হয়েছে, অনুমোদনের অপেক্ষায় আছে" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "আপনি ইতিমধ্যে এই প্রোডাক্টে রিভিউ দিয়েছেন" });
    }
    next(err);
  }
};

// ===== ADMIN =====

// @desc  Get all pending reviews (admin)
// @route GET /api/admin/reviews/pending
exports.getPendingReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isApproved: false }).populate("product", "name").sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

// @desc  Approve a review + recalculate product rating (admin)
// @route PATCH /api/admin/reviews/:id/approve
exports.approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: "রিভিউ পাওয়া যায়নি" });

    const approvedReviews = await Review.find({ product: review.product, isApproved: true });
    const avg = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;

    await Product.findByIdAndUpdate(review.product, {
      ratingAvg: avg.toFixed(1),
      ratingCount: approvedReviews.length,
    });

    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete/reject a review (admin)
// @route DELETE /api/admin/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "রিভিউ মুছে ফেলা হয়েছে" });
  } catch (err) {
    next(err);
  }
};
