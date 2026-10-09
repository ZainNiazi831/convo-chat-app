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

// 🎯 Allowed origins list (local + production)
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000",
    process.env.CLIENT_URL,
    "https://convo-chat-app-ochre.vercel.app",
    "https://convo-chat-app-production.up.railway.app",
].filter(Boolean);

// ✅ CORS configuration (handles OPTIONS automatically)
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests without origin (mobile apps, Postman, curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log("❌ CORS blocked:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// ─── Test Route ───
app.get("/", (req, res) => {
    res.json({ message: "Chat API is running" });
});

// ─── API Routes ───
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// ─── Error Handling ───
app.use(notFound);
app.use(errorHandler);

// ─── Initialize Socket.io ───
initSocket(httpServer);

// ─── Start Server ───
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`✅ Allowed origins:`, allowedOrigins);
    connectDB();
});