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

    // 📨 Handle incoming messages
    useEffect(() => {
        if (!socket || !user) return;

        const handleReceive = (message) => {
            const senderId =
                typeof message.sender === "object"
                    ? message.sender?._id
                    : message.sender;

            const currentUserId = user._id || user.id;
            if (String(senderId) === String(currentUserId)) return;

            dispatch(addIncomingMessage(message));

            // Play sound if not in current conversation
            const currentConvId = selectedConvRef.current?._id;
            const isCurrentConv =
                currentConvId && String(message.conversation) === String(currentConvId);

            if (!isCurrentConv) {
                try {
                    const audio = new Audio("/notification.mp3");
                    audio.volume = 0.5;
                    audio.play().catch(() => { });
                } catch (err) {
                    // Silent fail
                }
            }
        };

        socket.on("receiveMessage", handleReceive);

        return () => {
            socket.off("receiveMessage", handleReceive);
        };
    }, [socket, dispatch, user]);

    // 🚪 Join/leave conversation room
    useEffect(() => {
        if (!socket || !selectedConversation) return;

        socket.emit("joinConversation", selectedConversation._id);

        return () => {
            socket.emit("leaveConversation", selectedConversation._id);
        };
    }, [socket, selectedConversation]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};