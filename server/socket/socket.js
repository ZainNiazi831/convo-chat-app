import { Server } from "socket.io";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const onlineUsers = new Map();

// 🎯 Allowed origins for Socket.io
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.CLIENT_URL,
    "https://convo-chat-app-ochre.vercel.app",
    "https://convo-chat-app-production.up.railway.app",
].filter(Boolean);

export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: function (origin, callback) {
                // Allow requests without origin (mobile apps, Postman)
                if (!origin) return callback(null, true);

                if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    console.log("❌ Socket CORS blocked:", origin);
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true,
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

                // Mark all pending messages as delivered
                const userConversations = await Conversation.find({
                    members: { $in: [userId] },
                }).select("_id");

                const convIds = userConversations.map((c) => c._id);

                const pendingMessages = await Message.find({
                    conversation: { $in: convIds },
                    sender: { $ne: userId },
                    deliveredAt: null,
                }).populate("sender", "_id");

                if (pendingMessages.length > 0) {
                    console.log(
                        `📬 Marking ${pendingMessages.length} messages as delivered for user ${userId}`
                    );

                    await Message.updateMany(
                        {
                            conversation: { $in: convIds },
                            sender: { $ne: userId },
                            deliveredAt: null,
                        },
                        { deliveredAt: new Date() }
                    );

                    for (const msg of pendingMessages) {
                        const senderId =
                            msg.sender?._id?.toString() || msg.sender.toString();
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

        // ──────── SEND MESSAGE ────────
        socket.on("sendMessage", async (message) => {
            socket.to(message.conversation).emit("receiveMessage", message);

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

        // 🔥 ──────── MESSAGE DELETED FOR EVERYONE ────────
        socket.on("messageDeletedForEveryone", ({ conversationId, message }) => {
            console.log("🗑️ Message deleted for everyone:", message._id);
            socket.to(conversationId).emit("messageDeletedForEveryone", {
                conversationId,
                message,
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