import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer storage in memory
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// @desc    Upload image/file to Cloudinary
// @route   POST /api/upload
// @access  Private
router.post("/", protect, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const isImage = req.file.mimetype.startsWith("image/");
        const resourceType = isImage ? "image" : "raw";

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "convo-chat",
                    resource_type: resourceType,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        res.json({
            url: result.secure_url,
            publicId: result.public_id,
            fileType: req.file.mimetype,
            fileName: req.file.originalname,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;