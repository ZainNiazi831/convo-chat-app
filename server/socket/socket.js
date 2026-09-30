import { Server } from "socket.io";
import User from "../models/User.js";

// Map of userId -> socketId
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

        // User comes online
        socket.on("userOnline", async (userId) => {
            if (!userId) return;
            onlineUsers.set(userId, socket.id);

            try {
                await User.findByIdAndUpdate(userId, { isOnline: true });
            } catch (err) {
                console.error("User online update error:", err.message);
            }

            io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        });

        // Join a conversation room
        socket.on("joinConversation", (conversationId) => {
            socket.join(conversationId);
            console.log(`📥 Socket ${socket.id} joined room ${conversationId}`);
        });

        // Leave a conversation room
        socket.on("leaveConversation", (conversationId) => {
            socket.leave(conversationId);
            console.log(`📤 Socket ${socket.id} left room ${conversationId}`);
        });

        // Send message in real-time
        // socket.to(room) already excludes the sender — so only OTHER users get it
        socket.on("sendMessage", (message) => {
            socket.to(message.conversation).emit("receiveMessage", message);
        });

        // Typing indicator
        socket.on("typing", ({ conversationId, userId, username }) => {
            socket.to(conversationId).emit("userTyping", { userId, username });
        });

        socket.on("stopTyping", ({ conversationId, userId }) => {
            socket.to(conversationId).emit("userStoppedTyping", { userId });
        });

        // Disconnect
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