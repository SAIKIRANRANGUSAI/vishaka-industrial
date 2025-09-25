// const cloudinary = require("./../config/cloudinary");
// const fs = require("fs");

// /**
//  * Upload a file to Cloudinary and remove local temp
//  * @param {string} filePath - local path
//  * @param {string} folder - folder name in Cloudinary
//  * @returns {Promise<{url: string, public_id: string}>}
//  */
// const uploadToCloudinary = async (filePath, folder = "general") => {
//   try {
//     const result = await cloudinary.uploader.upload(filePath, { folder });
//     fs.unlinkSync(filePath); // remove local temp file
//     return { url: result.secure_url, public_id: result.public_id };
//   } catch (err) {
//     console.error("Cloudinary upload error:", err);
//     throw err;
//   }
// };

// /**
//  * Delete file from Cloudinary
//  * @param {string} publicId
//  */
// const deleteFromCloudinary = async (publicId) => {
//   if (!publicId) return;
//   try {
//     await cloudinary.uploader.destroy(publicId);
//   } catch (err) {
//     console.error("Cloudinary delete error:", err);
//   }
// };

// /**
//  * Process image for admin upload (upload new and delete old)
//  * @param {Object} file - multer file object
//  * @param {Object|string} oldData - previous image object or URL
//  * @param {string} folder - Cloudinary folder
//  * @returns {Promise<{url: string, public_id: string}>}
//  */
// const processImage = async (file, oldData, folder = "home_banners") => {
//   if (!file) {
//     if (!oldData) return null;
//     return typeof oldData === "string" ? { url: oldData } : oldData;
//   }

//   // Upload new file
//   const uploaded = await uploadToCloudinary(file.path, folder);

//   // Delete old image if exists
//   if (oldData?.public_id) {
//     await deleteFromCloudinary(oldData.public_id);
//   } else if (oldData && typeof oldData === "string") {
//     const segments = oldData.split("/");
//     const fileName = segments.pop().split(".")[0];
//     await deleteFromCloudinary(`${folder}/${fileName}`);
//   }

//   return uploaded;
// };

// module.exports = { uploadToCloudinary, deleteFromCloudinary, processImage };
const cloudinary = require("./../config/cloudinary");

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - multer memory buffer
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<{url: string, public_id: string}>}
 */
const uploadToCloudinary = (fileBuffer, folder = "general") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(fileBuffer); // send the buffer
  });
};
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }
};

/**
 * Process image for admin upload
 * @param {Object} file - multer file object
 * @param {Object|string} oldData - previous image object or URL
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<{url: string, public_id: string}>}
 */
const processImage = async (file, oldData, folder = "home_banners") => {
  if (!file) {
    if (!oldData) return null;
    return typeof oldData === "string" ? { url: oldData } : oldData;
  }

  // Upload new file from memory buffer
  const uploaded = await uploadToCloudinary(file.buffer, folder);

  // Delete old image if exists
  if (oldData?.public_id) {
    await deleteFromCloudinary(oldData.public_id);
  } else if (oldData && typeof oldData === "string") {
    const segments = oldData.split("/");
    const fileName = segments.pop().split(".")[0];
    await deleteFromCloudinary(`${folder}/${fileName}`);
  }

  return uploaded;
};

module.exports = { uploadToCloudinary, deleteFromCloudinary, processImage };
