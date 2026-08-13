const multer = require("multer");

// Keep the file in memory (as a Buffer) instead of writing to disk —
// we immediately stream it to Cloudinary, so we never need a local copy.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("শুধুমাত্র ছবি ফাইল (jpg, png, webp) আপলোড করা যাবে"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
});

module.exports = upload;
