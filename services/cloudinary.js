const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath, resourceType = 'auto') => {
  return cloudinary.uploader.upload(filePath, { resource_type: resourceType });
};

module.exports = { cloudinary, uploadToCloudinary }; 