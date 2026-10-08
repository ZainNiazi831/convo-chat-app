import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import mongoose from "mongoose";

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

            const currentUserId = req.user._id;
            const otherUserId = userId;

            if (String(currentUserId) === String(otherUserId)) {
                return res
                    .status(400)
                    .json({ message: "Cannot create conversation with yourself" });
            }

            const otherUserObjectId = mongoose.Types.ObjectId.isValid(otherUserId)
                ? new mongoose.Types.ObjectId(otherUserId)
                : otherUserId;

            let conversation = await Conversation.findOne({
                type: "private",
                members: {
                    $all: [currentUserId, otherUserObjectId],
                    $size: 2,
                },
            })
                .populate("members", "-password")
                .populate("lastMessage");

            if (conversation) {
                console.log(
                    "✅ Existing conversation found:",
                    conversation._id.toString()
                );
                return res.json(conversation);
            }

            console.log("🆕 Creating new private conversation");
            conversation = await Conversation.create({
                type: "private",
                members: [currentUserId, otherUserObjectId],
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

        const validMembers = members.filter((m) =>
            mongoose.Types.ObjectId.isValid(m)
        );

        console.log("🆕 Creating new group:", name);

        // 🔥 FIX: Create first, then populate sequentially (not chained)
        let conversation = await Conversation.create({
            type: "group",
            name,
            members: [...validMembers, req.user._id],
            groupAdmin: req.user._id,
        });

        conversation = await conversation.populate("members", "-password");
        conversation = await conversation.populate("groupAdmin", "-password");

        res.status(201).json(conversation);
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

// ──────── GROUP FUNCTIONS ────────

// @desc    Add members to group
// @route   PUT /api/conversations/:id/add-members
// @access  Private (admin only)
export const addMembersToGroup = async (req, res) => {
    try {
        const { members } = req.body;
        let conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Not a group conversation" });
        }

        if (String(conversation.groupAdmin) !== String(req.user._id)) {
            return res.status(403).json({ message: "Only admin can add members" });
        }

        const existingIds = conversation.members.map((m) => m.toString());
        const newMembers = members.filter(
            (m) => !existingIds.includes(m.toString())
        );

        conversation.members.push(...newMembers);
        await conversation.save();

        conversation = await conversation.populate("members", "-password");
        conversation = await conversation.populate("groupAdmin", "-password");

        res.json(conversation);
    } catch (error) {
        console.error("addMembersToGroup error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove member from group
// @route   PUT /api/conversations/:id/remove-member
// @access  Private (admin only)
export const removeMemberFromGroup = async (req, res) => {
    try {
        const { memberId } = req.body;
        let conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Not a group conversation" });
        }

        if (String(conversation.groupAdmin) !== String(req.user._id)) {
            return res
                .status(403)
                .json({ message: "Only admin can remove members" });
        }

        conversation.members = conversation.members.filter(
            (m) => m.toString() !== memberId
        );
        await conversation.save();

        conversation = await conversation.populate("members", "-password");
        conversation = await conversation.populate("groupAdmin", "-password");

        res.json(conversation);
    } catch (error) {
        console.error("removeMemberFromGroup error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update group name
// @route   PUT /api/conversations/:id/group-name
// @access  Private (admin only)
export const updateGroupName = async (req, res) => {
    try {
        const { name } = req.body;
        let conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Not a group conversation" });
        }

        if (String(conversation.groupAdmin) !== String(req.user._id)) {
            return res
                .status(403)
                .json({ message: "Only admin can update group name" });
        }

        conversation.name = name;
        await conversation.save();

        conversation = await conversation.populate("members", "-password");
        conversation = await conversation.populate("groupAdmin", "-password");

        res.json(conversation);
    } catch (error) {
        console.error("updateGroupName error:", error);
        res.status(500).json({ message: error.message });
    }
};