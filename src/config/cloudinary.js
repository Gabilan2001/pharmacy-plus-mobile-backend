
const cloudinary = require('cloudinary').v2;
const path = require('path');
const dotenv = require('dotenv');

// Ensure .env is loaded even if this module is required before app.js
try {
  const envPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: envPath });
} catch (e) {
  // ignore
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('[Cloudinary] Missing credentials. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in backend/.env');
}

module.exports = cloudinary;
