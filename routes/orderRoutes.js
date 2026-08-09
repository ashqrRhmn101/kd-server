const express = require("express");
const router = express.Router();
const { placeOrder, getMyOrders, trackOrder } = require("../controllers/orderController");
const { attachUser, requireAuth } = require("../middleware/auth");

router.post("/", attachUser, placeOrder); // attachUser but NOT requireAuth -> guest checkout allowed
router.get("/my-orders", attachUser, requireAuth, getMyOrders);
router.get("/track/:orderNumber", trackOrder);

module.exports = router;
