const express = require("express");
const router = express.Router();
const { attachUser, requireAuth, requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

const { createProduct, updateProduct, deleteProduct, getProductByIdAdmin } = require("../controllers/productController");
const { createCategory, updateCategory, deleteCategory, getAllCategoriesAdmin } = require("../controllers/categoryController");
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats,
  getNewOrderNotifications,
  markAllOrdersSeen,
} = require("../controllers/orderController");
const { getPendingReviews, approveReview, deleteReview } = require("../controllers/reviewController");
const { uploadImage } = require("../controllers/uploadController");

// Every route below requires a logged-in admin
router.use(attachUser, requireAuth, requireAdmin);

router.get("/dashboard", getDashboardStats);

router.post("/upload", upload.single("image"), uploadImage);

router.post("/products", createProduct);
router.get("/products/:id", getProductByIdAdmin);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.post("/categories", createCategory);
router.get("/categories", getAllCategoriesAdmin);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// IMPORTANT: notification routes must be registered BEFORE /orders/:id,
// otherwise Express would treat "notifications" as an :id value.
router.get("/orders/notifications", getNewOrderNotifications);
router.patch("/orders/notifications/mark-seen", markAllOrdersSeen);
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);
router.patch("/orders/:id/status", updateOrderStatus);

router.get("/reviews/pending", getPendingReviews);
router.patch("/reviews/:id/approve", approveReview);
router.delete("/reviews/:id", deleteReview);

module.exports = router;
