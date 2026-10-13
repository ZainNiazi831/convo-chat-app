import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { conversationId, text, replyTo, image, file, fileType, fileName } =
            req.body;

        if (!conversationId || (!text && !image && !file)) {
            return res.status(400).json({ message: "Message content is required" });
        }

        let message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            text: text || "",
            replyTo: replyTo || null,
            image: image || "",
            file: file || "",
            fileType: fileType || "",
            fileName: fileName || "",
        });

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
        });

        message = await message.populate("sender", "-password");
        message = await message.populate({
            path: "replyTo",
            populate: { path: "sender", select: "name username" },
        });

        res.status(201).json(message);
    } catch (error) {
        console.error("sendMessage error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all messages of a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.find({
            conversation: req.params.conversationId,
            deletedFor: { $ne: userId },
        })
            .populate("sender", "-password")
            .populate({
                path: "replyTo",
                populate: { path: "sender", select: "name username" },
            })
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error("getMessages error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all messages in a conversation as read
// @route   PUT /api/messages/:conversationId/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const userId = req.user._id;

        const result = await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: userId },
                isRead: false,
            },
            {
                isRead: true,
                readAt: new Date(),
                deliveredAt: new Date(),
            }
        );

        res.json({
            message: "Messages marked as read",
            modified: result.modifiedCount,
        });
    } catch (error) {
        console.error("markAsRead error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark messages as delivered
// @route   PUT /api/messages/:conversationId/delivered
// @access  Private
export const markAsDelivered = async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const userId = req.user._id;

        const result = await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: userId },
                deliveredAt: null,
            },
            { deliveredAt: new Date() }
        );

        res.json({
            message: "Messages marked as delivered",
            modified: result.modifiedCount,
        });
    } catch (error) {
        console.error("markAsDelivered error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete message for me
// @route   DELETE /api/messages/:id/me
// @access  Private
export const deleteForMe = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (!message.deletedFor.includes(userId)) {
            message.deletedFor.push(userId);
            await message.save();
        }

        res.json({ message: "Deleted for you", messageId });
    } catch (error) {
        console.error("deleteForMe error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete message for everyone
// @route   DELETE /api/messages/:id/everyone
// @access  Private
export const deleteForEveryone = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.sender.toString() !== userId.toString()) {
            return res
                .status(403)
                .json({ message: "You can only delete your own messages" });
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.text = "This message was deleted";
        await message.save();

        const populated = await message.populate("sender", "-password");

        res.json({ message: "Deleted for everyone", data: populated });
    } catch (error) {
        console.error("deleteForEveryone error:", error);
        res.status(500).json({ message: error.message });
    }
};
// @desc    Toggle reaction on a message (one emoji per user)
// @route   PUT /api/messages/:id/react
// @access  Private
export const toggleReaction = async (req, res) => {
    try {
        const messageId = req.params.id;
        const { emoji } = req.body;
        const userId = req.user._id;

        if (!emoji) {
            return res.status(400).json({ message: "Emoji is required" });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Ensure reactions is a Map
        if (!(message.reactions instanceof Map)) {
            message.reactions = new Map(
                Object.entries(message.reactions || {})
            );
        }

        // 🔥 STEP 1: Check if user already reacted with THIS emoji
        const currentUsers = message.reactions.get(emoji) || [];
        const alreadyReactedWithThis = currentUsers.findIndex(
            (id) => id.toString() === userId.toString()
        ) !== -1;

        // 🔥 STEP 2: Remove user from ALL other emojis
        for (const [existingEmoji, users] of message.reactions.entries()) {
            const filtered = users.filter(
                (id) => id.toString() !== userId.toString()
            );
            if (filtered.length === 0) {
                message.reactions.delete(existingEmoji);
            } else {
                message.reactions.set(existingEmoji, filtered);
            }
        }

        // 🔥 STEP 3: If user had already reacted with same emoji → toggle OFF (remove)
        // If user reacted with a DIFFERENT emoji → remove old, add new
        if (!alreadyReactedWithThis) {
            // Add new reaction
            const updatedUsers = [...currentUsers.filter(
                (id) => id.toString() !== userId.toString()
            ), userId];
            message.reactions.set(emoji, updatedUsers);
        }
        // else: alreadyReactedWithThis is true → we already removed it in STEP 2 → toggle OFF

        message.markModified("reactions");
        await message.save();

        // ✅ Populate sequentially
        let populated = await message.populate("sender", "-password");
        populated = await populated.populate({
            path: "replyTo",
            populate: { path: "sender", select: "name username" },
        });

        res.json(populated);
    } catch (error) {
        console.error("toggleReaction error:", error);
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get unread message counts
// @route   GET /api/messages/unread/counts
// @access  Private
export const getUnreadCounts = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            members: { $in: [userId] },
        }).populate("members", "_id");

        const counts = await Message.aggregate([
            {
                $match: {
                    conversation: { $in: conversations.map((c) => c._id) },
                    sender: { $ne: userId },
                    isRead: false,
                    deletedFor: { $ne: userId },
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: "$conversation",
                    count: { $sum: 1 },
                },
            },
        ]);

        const result = {};
        for (const c of counts) {
            const conv = conversations.find(
                (conv) => conv._id.toString() === c._id.toString()
            );
            if (!conv) continue;

            if (conv.type === "private") {
                const otherMember = conv.members.find(
                    (m) => m._id.toString() !== userId.toString()
                );
                if (otherMember) {
                    result[otherMember._id.toString()] = c.count;
                }
            } else {
                result[c._id.toString()] = c.count;
            }
        }

        res.json(result);
    } catch (error) {
        console.error("getUnreadCounts error:", error);
        res.status(500).json({ message: error.message });
    }
};