import { Server } from "socket.io";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const onlineUsers = new Map();

export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("🔌 Socket connected:", socket.id);

        // ──────── USER ONLINE ────────
        socket.on("userOnline", async (userId) => {
            if (!userId) return;
            onlineUsers.set(userId, socket.id);

            try {
                await User.findByIdAndUpdate(userId, { isOnline: true });

                // 🔥 Mark ALL pending messages delivered for this user
                const userConversations = await Conversation.find({
                    members: { $in: [userId] },
                }).select("_id");

                const convIds = userConversations.map((c) => c._id);

                // Find all undelivered messages (sent to this user)
                const pendingMessages = await Message.find({
                    conversation: { $in: convIds },
                    sender: { $ne: userId },
                    deliveredAt: null,
                }).populate("sender", "_id");

                if (pendingMessages.length > 0) {
                    console.log(
                        `📬 Marking ${pendingMessages.length} messages as delivered for user ${userId}`
                    );

                    // Mark all as delivered
                    await Message.updateMany(
                        {
                            conversation: { $in: convIds },
                            sender: { $ne: userId },
                            deliveredAt: null,
                        },
                        { deliveredAt: new Date() }
                    );

                    // Notify each sender's socket
                    for (const msg of pendingMessages) {
                        const senderId = msg.sender?._id?.toString() || msg.sender.toString();
                        const senderSocketId = onlineUsers.get(senderId);

                        if (senderSocketId) {
                            io.to(senderSocketId).emit("messagesDelivered", {
                                conversationId: msg.conversation,
                                messageId: msg._id,
                                deliveredAt: new Date(),
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("User online update error:", err.message);
            }

            io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        });

        // ──────── JOIN / LEAVE ROOMS ────────
        socket.on("joinConversation", (conversationId) => {
            socket.join(conversationId);
            console.log(`🔵 Socket ${socket.id} joined room ${conversationId}`);
        });

        socket.on("leaveConversation", (conversationId) => {
            socket.leave(conversationId);
            console.log(`🔵 Socket ${socket.id} left room ${conversationId}`);
        });

        // ──────── SEND MESSAGE (Auto-Delivered) ────────
        socket.on("sendMessage", async (message) => {
            // Broadcast to room (except sender)
            socket.to(message.conversation).emit("receiveMessage", message);

            // Check if any other member is online → mark delivered
            try {
                const conversation = await Conversation.findById(message.conversation);
                if (!conversation) return;

                const senderId = message.sender?._id || message.sender;
                const otherMembers = conversation.members.filter(
                    (m) => String(m) !== String(senderId)
                );

                const anyOtherOnline = otherMembers.some((m) =>
                    onlineUsers.has(String(m))
                );

                if (anyOtherOnline) {
                    await Message.findByIdAndUpdate(message._id, {
                        deliveredAt: new Date(),
                    });

                    socket.to(message.conversation).emit("messagesDelivered", {
                        conversationId: message.conversation,
                        messageId: message._id,
                        deliveredAt: new Date(),
                    });
                }
            } catch (err) {
                console.error("Delivered mark error:", err.message);
            }
        });

        // ──────── MESSAGES READ ────────
        socket.on("messagesRead", ({ conversationId, readerId }) => {
            socket.to(conversationId).emit("messagesRead", {
                conversationId,
                readerId,
                readAt: new Date(),
            });
        });

        // ──────── MESSAGES DELIVERED ────────
        socket.on("messagesDelivered", ({ conversationId, readerId }) => {
            socket.to(conversationId).emit("messagesDelivered", {
                conversationId,
                readerId,
                deliveredAt: new Date(),
            });
        });

        // ──────── TYPING ────────
        socket.on("typing", ({ conversationId, userId, username }) => {
            socket.to(conversationId).emit("userTyping", { userId, username });
        });

        socket.on("stopTyping", ({ conversationId, userId }) => {
            socket.to(conversationId).emit("userStoppedTyping", { userId });
        });

        // ──────── DISCONNECT ────────
        socket.on("disconnect", async () => {
            console.log("❌ Socket disconnected:", socket.id);
            let disconnectedUserId = null;
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }
            if (disconnectedUserId) {
                try {
                    await User.findByIdAndUpdate(disconnectedUserId, {
                        isOnline: false,
                        lastSeen: new Date(),
                    });
                } catch (err) {
                    console.error("User offline update error:", err.message);
                }
                io.emit("onlineUsers", Array.from(onlineUsers.keys()));
            }
        });
    });

    return io;
};