import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { addIncomingMessage } from "../redux/chatSlice";
import API from "../services/api";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useSelector((state) => state.auth);
    const { selectedConversation } = useSelector((state) => state.chat);
    const dispatch = useDispatch();
    const socketRef = useRef(null);
    const joinedRoomsRef = useRef(new Set());
    const selectedConvRef = useRef(selectedConversation);

    // Keep fresh ref of selectedConversation
    useEffect(() => {
        selectedConvRef.current = selectedConversation;
    }, [selectedConversation]);

    // 🔌 Connect socket when user logs in
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

        const newSocket = io("http://localhost:5000", {
            transports: ["websocket"],
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on("connect", async () => {
            console.log("✅ Socket connected:", newSocket.id);
            newSocket.emit("userOnline", user._id);

            // 🎯 Join ALL conversations of user immediately
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
        });

        newSocket.on("onlineUsers", (users) => {
            setOnlineUsers(users);
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
    }, [user]);

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

            // Notification sound
            try {
                const audio = new Audio("/notification.mp3");
                audio.volume = 0.5;
                audio.play().catch(() => { });
            } catch (err) {
                // Silent
            }
        };

        socket.on("receiveMessage", handleReceive);

        return () => {
            socket.off("receiveMessage", handleReceive);
        };
    }, [socket, dispatch, user]);

    // 🎯 When a NEW conversation is opened (that wasn't joined at connect),
    // join its room too. NEVER leave rooms.
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