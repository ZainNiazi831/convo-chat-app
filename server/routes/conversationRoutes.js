import express from "express";
import {
    createConversation,
    getConversations,
    getConversationById,
    deleteConversation,
    addMembersToGroup,
    removeMemberFromGroup,
    updateGroupName,
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

export default router;