import express from "express";
import {
    sendMessage,
    getMessages,
    markAsRead,
    markAsDelivered,
    deleteMessage,
    getUnreadCounts,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/unread/counts", protect, getUnreadCounts);
router.get("/:conversationId", protect, getMessages);
router.put("/:conversationId/read", protect, markAsRead);
router.put("/:conversationId/delivered", protect, markAsDelivered);
router.delete("/:id", protect, deleteMessage);

export default router;