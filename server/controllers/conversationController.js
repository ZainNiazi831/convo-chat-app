import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

// @desc    Create or get private conversation
// @route   POST /api/conversations
// @access  Private
export const createConversation = async (req, res) => {
    try {
        const { userId, isGroup, members, name } = req.body;

        // ─── PRIVATE CHAT ───
        if (!isGroup) {
            if (!userId) {
                return res.status(400).json({ message: "UserId is required" });
            }

            if (userId === req.user._id.toString()) {
                return res
                    .status(400)
                    .json({ message: "Cannot create conversation with yourself" });
            }

            // Strictly find conversation with EXACTLY these 2 members
            const allConversations = await Conversation.find({
                type: "private",
                members: { $all: [req.user._id, userId] },
            })
                .populate("members", "-password")
                .populate("lastMessage");

            // Filter: only conversations with exactly 2 members
            let conversation = allConversations.find((c) => c.members.length === 2);

            if (conversation) {
                return res.json(conversation);
            }

            // Create new
            conversation = await Conversation.create({
                type: "private",
                members: [req.user._id, userId],
            });

            conversation = await conversation.populate("members", "-password");

            return res.status(201).json(conversation);
        }

        // ─── GROUP CHAT ───
        if (!members || members.length < 2 || !name) {
            return res.status(400).json({
                message: "Group must have a name and at least 2 members",
            });
        }

        const conversation = await Conversation.create({
            type: "group",
            name,
            members: [...members, req.user._id],
            groupAdmin: req.user._id,
        });

        const populated = await conversation.populate("members", "-password");

        res.status(201).json(populated);
    } catch (error) {
        console.error("createConversation error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all conversations of current user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            members: { $in: [req.user._id] },
        })
            .populate("members", "-password")
            .populate("lastMessage")
            .populate("groupAdmin", "-password")
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single conversation
// @route   GET /api/conversations/:id
// @access  Private
export const getConversationById = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id)
            .populate("members", "-password")
            .populate("lastMessage")
            .populate("groupAdmin", "-password");

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete conversation
// @route   DELETE /api/conversations/:id
// @access  Private
export const deleteConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        await conversation.deleteOne();
        res.json({ message: "Conversation deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};