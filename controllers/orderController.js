const Order = require("../models/Order");
const Product = require("../models/Product");

const generateOrderNumber = () => "KD" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);

// @desc  Place order (works for guest OR logged-in user)
// @route POST /api/orders
exports.placeOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, guestInfo } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "কার্ট খালি" });
    }
    if (!req.user && (!guestInfo?.name || !guestInfo?.phone)) {
      return res.status(400).json({ success: false, message: "নাম ও ফোন নাম্বার দিন" });
    }

    // Re-validate prices & stock from DB (never trust client-sent prices)
    let itemsTotal = 0;
    const verifiedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `প্রোডাক্ট পাওয়া যায়নি` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `${product.name} - স্টকে নেই` });
      }
      const price = product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;
      itemsTotal += price * item.quantity;
      verifiedItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0],
        price,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant || {},
      });
    }

    const deliveryCharge = shippingAddress.city?.toLowerCase() === "dhaka" ? 60 : 120;
    const grandTotal = itemsTotal + deliveryCharge;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user ? req.user._id : null,
      guestInfo: req.user ? undefined : guestInfo,
      items: verifiedItems,
      shippingAddress,
      paymentMethod,
      itemsTotal,
      deliveryCharge,
      grandTotal,
      statusHistory: [{ status: "pending", note: "অর্ডার তৈরি হয়েছে" }],
    });

    // Decrement stock
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc  Get logged-in user's own orders
// @route GET /api/orders/my-orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

// @desc  Track a single order by order number (public - guest can track too)
// @route GET /api/orders/track/:orderNumber
exports.trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ success: false, message: "অর্ডার পাওয়া যায়নি" });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ===== ADMIN =====

// @desc  Get all orders (admin) with status filter + pagination
// @route GET /api/admin/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).populate("user", "name email phone").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, orders, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single order detail (admin) — also marks it as "seen" for notifications
// @route GET /api/admin/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { isSeenByAdmin: true }, { new: true }).populate(
      "user",
      "name email phone"
    );
    if (!order) return res.status(404).json({ success: false, message: "অর্ডার পাওয়া যায়নি" });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc  Get unseen/new orders for the notification bell (admin)
// @route GET /api/admin/orders/notifications
exports.getNewOrderNotifications = async (req, res, next) => {
  try {
    const orders = await Order.find({ isSeenByAdmin: false }).sort({ createdAt: -1 }).limit(20).select("orderNumber grandTotal createdAt guestInfo user").populate("user", "name");
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

// @desc  Mark all pending notifications as seen (e.g. when bell dropdown is opened)
// @route PATCH /api/admin/orders/notifications/mark-seen
exports.markAllOrdersSeen = async (req, res, next) => {
  try {
    await Order.updateMany({ isSeenByAdmin: false }, { isSeenByAdmin: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// @desc  Update order status (admin)
// @route PATCH /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, trackingId, courier } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "অর্ডার পাওয়া যায়নি" });

    if (status) order.status = status;
    if (trackingId) order.trackingId = trackingId;
    if (courier) order.courier = courier;
    order.statusHistory.push({ status: status || order.status, note: note || "" });

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc  Admin dashboard summary stats
// @route GET /api/admin/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalOrders, pendingOrders, newOrdersCount, totalRevenueAgg, totalProducts, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ isSeenByAdmin: false }),
      Order.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, sum: { $sum: "$grandTotal" } } }]),
      Product.countDocuments({ isActive: true }),
      Order.find().sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        newOrdersCount,
        totalRevenue: totalRevenueAgg[0]?.sum || 0,
        totalProducts,
      },
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};
