const express = require("express");
const router = express.Router();
const { attachUser, requireAuth, requireAdmin } = require("../middleware/auth");

const { createProduct, updateProduct, deleteProduct } = require("../controllers/productController");
const { createCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { getAllOrders, getOrderById, updateOrderStatus, getDashboardStats } = require("../controllers/orderController");
const { getPendingReviews, approveReview, deleteReview } = require("../controllers/reviewController");

// Every route below requires a logged-in admin
router.use(attachUser, requireAuth, requireAdmin);

router.get("/dashboard", getDashboardStats);

router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);
router.patch("/orders/:id/status", updateOrderStatus);

router.get("/reviews/pending", getPendingReviews);
router.patch("/reviews/:id/approve", approveReview);
router.delete("/reviews/:id", deleteReview);

module.exports = router;
