import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { addIncomingMessage } from "../redux/chatSlice";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useSelector((state) => state.auth);
    const { selectedConversation } = useSelector((state) => state.chat);
    const dispatch = useDispatch();
    const socketRef = useRef(null);
    const selectedConvRef = useRef(selectedConversation);

    // Keep a fresh ref to selectedConversation for socket handler
    useEffect(() => {
        selectedConvRef.current = selectedConversation;
    }, [selectedConversation]);

    // 🔌 Socket connect (once per user)
    useEffect(() => {
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        const newSocket = io("http://localhost:5000", {
            transports: ["websocket"],
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("✅ Socket connected:", newSocket.id);
            newSocket.emit("userOnline", user._id);
        });

        newSocket.on("onlineUsers", (users) => {
            setOnlineUsers(users);
        });

        newSocket.on("disconnect", () => {
            console.log("❌ Socket disconnected");
        });

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
        };
    }, [user]);

    // 📨 Handle incoming real-time messages
    useEffect(() => {
        if (!socket || !user) return;

        const handleReceive = (message) => {
            console.log("📥 [SOCKET RECEIVE]", message);

            // Normalize sender ID
            const senderId =
                typeof message.sender === "object"
                    ? message.sender?._id
                    : message.sender;

            const currentUserId = user._id || user.id;

            // ⏭ Skip own messages (they come from REST response already)
            if (String(senderId) === String(currentUserId)) {
                console.log("   ⏭ Own message, skipping");
                return;
            }

            // Only add if message belongs to currently open conversation
            const currentConvId = selectedConvRef.current?._id;
            if (currentConvId && String(message.conversation) === String(currentConvId)) {
                dispatch(addIncomingMessage(message));
            } else {
                console.log("   ⚠ Message not for current conversation, ignoring UI");
            }

            // 🔊 Notification sound if not viewing that conversation
            if (
                !selectedConvRef.current ||
                String(selectedConvRef.current._id) !== String(message.conversation)
            ) {
                try {
                    const audio = new Audio("/notification.mp3");
                    audio.volume = 0.5;
                    audio.play().catch(() => { });
                } catch (err) {
                    console.log("Sound error:", err.message);
                }
            }
        };

        socket.on("receiveMessage", handleReceive);

        return () => {
            socket.off("receiveMessage", handleReceive);
        };
    }, [socket, dispatch, user]);

    // 🚪 Auto-join/leave conversation room
    useEffect(() => {
        if (!socket || !selectedConversation) return;

        console.log("🚪 Joining room:", selectedConversation._id);
        socket.emit("joinConversation", selectedConversation._id);

        return () => {
            console.log("🚪 Leaving room:", selectedConversation._id);
            socket.emit("leaveConversation", selectedConversation._id);
        };
    }, [socket, selectedConversation]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};