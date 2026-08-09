const express = require("express");
const router = express.Router();
const { getProducts, getProductBySlug } = require("../controllers/productController");
const { getProductReviews, addReview } = require("../controllers/reviewController");
const { attachUser, requireAuth } = require("../middleware/auth");

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.get("/:productId/reviews", getProductReviews);
router.post("/:productId/reviews", attachUser, requireAuth, addReview);

module.exports = router;
