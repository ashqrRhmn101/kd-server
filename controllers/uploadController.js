const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const streamUpload = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => (result ? resolve(result) : reject(error))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

// @desc  Upload one image to Cloudinary (used by product & category forms)
// @route POST /api/admin/upload?folder=products|categories
exports.uploadImage = async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary এখনো সেটআপ করা হয়নি — backend/.env এ CLOUDINARY_* ভ্যারিয়েবল দিন",
      });
    }
    if (!req.file) return res.status(400).json({ success: false, message: "কোনো ছবি পাওয়া যায়নি" });

    const folder = `khalids-dreams/${req.query.folder === "categories" ? "categories" : "products"}`;
    const result = await streamUpload(req.file.buffer, folder);

    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
};
