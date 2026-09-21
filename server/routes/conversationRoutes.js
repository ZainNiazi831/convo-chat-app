import express from "express";
import {
    createConversation,
    getConversations,
    getConversationById,
    deleteConversation,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createConversation);
router.get("/", protect, getConversations);
router.get("/:id", protect, getConversationById);
router.delete("/:id", protect, deleteConversation);

export default router;