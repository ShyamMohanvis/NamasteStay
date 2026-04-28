const path = require("path");
const fs = require("fs");
const multer = require("multer");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

const uploadsDir = path.join(__dirname, "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

function looksLikePlaceholder(s) {
  const t = String(s || "").trim();
  if (!t) return true;
  if (/^your_/i.test(t)) return true;
  if (/^changeme/i.test(t)) return true;
  if (t === "your_api_key" || t === "your_api_secret" || t === "your_cloud_name") return true;
  return false;
}

/** Real Cloudinary creds only — never treat placeholders as valid. */
function cloudinaryEnvIsValid() {
  const name = (process.env.CLOUD_NAME || "").trim();
  const key = (process.env.CLOUD_API_KEY || "").trim();
  const secret = (process.env.CLOUD_API_SECRET || "").trim();
  if (!name || !key || !secret) return false;
  if (looksLikePlaceholder(name) || looksLikePlaceholder(key) || looksLikePlaceholder(secret)) {
    return false;
  }
  return true;
}

/**
 * Disk storage unless both: USE_CLOUDINARY is enabled AND env has non-placeholder keys.
 */
function useLocalUploads() {
  const flag = String(process.env.USE_CLOUDINARY ?? "").trim().toLowerCase();
  const wantsCloud =
    flag === "true" || flag === "1" || flag === "yes";
  if (!wantsCloud) return true;
  if (!cloudinaryEnvIsValid()) {
    console.warn(
      "[NamasteStay] Cloudinary requested but keys missing or still placeholders — using public/uploads/ instead."
    );
    return true;
  }
  return false;
}

let storage;
let cloudinary = null;

if (useLocalUploads()) {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "") || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
    },
  });
  console.log("[NamasteStay] Uploads: local files → public/uploads/");
} else {
  cloudinary = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "NamasteStay_DEV",
      allowed_formats: ["png", "jpg", "jpeg"],
    },
  });
  console.log("[NamasteStay] Uploads: Cloudinary");
}

module.exports = {
  storage,
  cloudinary,
  useLocalUploads,
};
