import express from "express";
import {
    createConversation,
    getConversations,
    getConversationById,
    deleteConversation,
    addMembersToGroup,
    removeMemberFromGroup,
    updateGroupName,
    toggleFavourite,
    clearChat,
    toggleMute,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Basic
router.post("/", protect, createConversation);
router.get("/", protect, getConversations);
router.get("/:id", protect, getConversationById);
router.delete("/:id", protect, deleteConversation);

// Group operations
router.put("/:id/add-members", protect, addMembersToGroup);
router.put("/:id/remove-member", protect, removeMemberFromGroup);
router.put("/:id/group-name", protect, updateGroupName);

// Chat actions
router.put("/:id/favourite", protect, toggleFavourite);
router.put("/:id/clear", protect, clearChat);
router.put("/:id/mute", protect, toggleMute);

export default router;