import express from "express";
import {
    getUsers,
    searchUsers,
    getUserById,
    getMyProfile,
    updateProfile,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/search", protect, searchUsers);
router.get("/profile/me", protect, getMyProfile);
router.put("/profile", protect, updateProfile);
router.get("/:id", protect, getUserById);

export default router;