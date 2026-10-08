import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { initSocket } from "./socket/socket.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({ message: "Chat API is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize Socket.io
initSocket(httpServer);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    connectDB();
});