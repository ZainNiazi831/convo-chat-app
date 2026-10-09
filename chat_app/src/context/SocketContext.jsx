import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import {
    addIncomingMessage,
    fetchUnreadCounts,
    markMessageDeleted,
} from "../redux/chatSlice";
import API from "../services/api";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// 🔑 Production & Development URLs
const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useSelector((state) => state.auth);
    const { selectedConversation } = useSelector((state) => state.chat);
    const dispatch = useDispatch();
    const socketRef = useRef(null);
    const joinedRoomsRef = useRef(new Set());
    const selectedConvRef = useRef(selectedConversation);

    useEffect(() => {
        selectedConvRef.current = selectedConversation;
    }, [selectedConversation]);

    // 🔌 Connect socket
    useEffect(() => {
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            joinedRoomsRef.current.clear();
            return;
        }

        const newSocket = io(SOCKET_URL, {
            transports: ["websocket"],
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on("connect", async () => {
            console.log("✅ Socket connected:", newSocket.id);
            console.log("🔗 Socket URL:", SOCKET_URL);
            newSocket.emit("userOnline", user._id);

            try {
                const res = await API.get("/conversations");
                const convos = res.data;
                convos.forEach((conv) => {
                    newSocket.emit("joinConversation", conv._id);
                    joinedRoomsRef.current.add(conv._id);
                    console.log("🚪 Joined room:", conv._id);
                });
            } catch (err) {
                console.error("Failed to join conversations:", err.message);
            }

            dispatch(fetchUnreadCounts());
        });

        newSocket.on("onlineUsers", (users) => {
            setOnlineUsers(users);
            dispatch(fetchUnreadCounts());
        });

        newSocket.on("disconnect", () => {
            console.log("❌ Socket disconnected");
            joinedRoomsRef.current.clear();
        });

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
            joinedRoomsRef.current.clear();
        };
    }, [user, dispatch]);

    // 📨 Handle incoming messages
    useEffect(() => {
        if (!socket || !user) return;

        const handleReceive = (message) => {
            console.log("📥 [SOCKET RECEIVE]", message);

            const senderId =
                typeof message.sender === "object"
                    ? message.sender?._id
                    : message.sender;

            const currentUserId = user._id || user.id;
            if (String(senderId) === String(currentUserId)) return;

            dispatch(addIncomingMessage(message));

            const currentConvId = selectedConvRef.current?._id;
            const isCurrentConvOpen =
                currentConvId && String(message.conversation) === String(currentConvId);

            // Mark as DELIVERED
            socket.emit("messagesDelivered", {
                conversationId: message.conversation,
                readerId: currentUserId,
            });

            fetch(
                `${API.defaults.baseURL}/messages/${message.conversation}/delivered`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${JSON.parse(localStorage.getItem("userInfo")).token
                            }`,
                    },
                }
            ).catch(() => { });

            // If current conv open, mark READ
            if (isCurrentConvOpen) {
                socket.emit("messagesRead", {
                    conversationId: message.conversation,
                    readerId: currentUserId,
                });

                fetch(
                    `${API.defaults.baseURL}/messages/${message.conversation}/read`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${JSON.parse(localStorage.getItem("userInfo")).token
                                }`,
                        },
                    }
                ).catch(() => { });
            } else {
                // Play notification sound
                try {
                    const audio = new Audio("/notification.mp3");
                    audio.volume = 0.5;
                    audio.play().catch(() => { });
                } catch (err) {
                    // Silent
                }
            }
        };

        socket.on("receiveMessage", handleReceive);

        return () => {
            socket.off("receiveMessage", handleReceive);
        };
    }, [socket, dispatch, user]);

    // 🔥 Handle real-time message deletion
    useEffect(() => {
        if (!socket) return;

        const handleDeletedForEveryone = ({ conversationId, message }) => {
            console.log("🗑️ [MESSAGE DELETED FOR EVERYONE]", message);
            dispatch(markMessageDeleted(message));
        };

        socket.on("messageDeletedForEveryone", handleDeletedForEveryone);

        return () => {
            socket.off("messageDeletedForEveryone", handleDeletedForEveryone);
        };
    }, [socket, dispatch]);

    // 🎯 When user opens a NEW conversation, join its room
    useEffect(() => {
        if (!socket || !selectedConversation) return;

        const convId = selectedConversation._id;
        if (!joinedRoomsRef.current.has(convId)) {
            socket.emit("joinConversation", convId);
            joinedRoomsRef.current.add(convId);
            console.log("🚪 Joined new room (on open):", convId);
        }
    }, [socket, selectedConversation]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};