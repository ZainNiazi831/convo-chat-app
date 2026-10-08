import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { conversationId, text } = req.body;

        if (!conversationId || !text) {
            return res.status(400).json({ message: "All fields are required" });
        }

        let message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            text,
        });

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
        });

        message = await message.populate("sender", "-password");

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
        const messages = await Message.find({
            conversation: req.params.conversationId,
        })
            .populate("sender", "-password")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
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

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "You can only delete your own messages" });
        }

        await message.deleteOne();
        res.json({ message: "Message deleted" });
    } catch (error) {
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

        // Aggregate unread counts by conversation
        const counts = await Message.aggregate([
            {
                $match: {
                    conversation: { $in: conversations.map((c) => c._id) },
                    sender: { $ne: userId },
                    isRead: false,
                },
            },
            {
                $group: {
                    _id: "$conversation",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Map conversation ID → sender user ID
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
                // Group: use conversation ID
                result[c._id.toString()] = c.count;
            }
        }

        res.json(result);
    } catch (error) {
        console.error("getUnreadCounts error:", error);
        res.status(500).json({ message: error.message });
    }
};