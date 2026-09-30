import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { sendMessage, showMobileSidebar } from "../redux/chatSlice";
import { useSocket } from "../context/SocketContext";
import useIsMobile from "../hooks/useIsMobile";

const ChatWindow = () => {
    const dispatch = useDispatch();
    const { socket } = useSocket();
    const isMobile = useIsMobile();
    const { selectedConversation, messages, isSending } = useSelector(
        (state) => state.chat
    );
    const { user } = useSelector((state) => state.auth);
    const [text, setText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleUserTyping = ({ userId }) => {
            const currentUserId = user._id || user.id;
            if (String(userId) !== String(currentUserId)) setOtherUserTyping(true);
        };

        const handleUserStoppedTyping = ({ userId }) => {
            const currentUserId = user._id || user.id;
            if (String(userId) !== String(currentUserId)) setOtherUserTyping(false);
        };

        socket.on("userTyping", handleUserTyping);
        socket.on("userStoppedTyping", handleUserStoppedTyping);

        return () => {
            socket.off("userTyping", handleUserTyping);
            socket.off("userStoppedTyping", handleUserStoppedTyping);
        };
    }, [socket, user]);

    useEffect(() => {
        setOtherUserTyping(false);
    }, [selectedConversation]);

    if (!selectedConversation) {
        return (
            <main style={styles.window}>
                <div style={styles.emptyState}>
                    <div style={styles.iconWrapper}>
                        <img src="/convo-logo.png" alt="Convo" style={styles.logoImg} />
                    </div>
                    <h2 style={styles.title}>Welcome to Convo</h2>
                    <p style={styles.subtitle}>
                        Select a user from the sidebar to start a conversation
                    </p>
                </div>
            </main>
        );
    }

    const currentUserId = user?._id || user?.id;

    const otherUser = selectedConversation.members?.find(
        (m) => String(m._id) !== String(currentUserId)
    );

    const isOwnMessage = (msg) => {
        if (!msg.sender) return false;
        const senderId =
            typeof msg.sender === "object"
                ? msg.sender._id || msg.sender.id
                : msg.sender;
        if (!senderId || !currentUserId) return false;
        return String(senderId) === String(currentUserId);
    };

    const handleSend = async () => {
        if (!text.trim() || isSending) return;

        const messageText = text.trim();
        setText("");

        if (socket && isTyping) {
            socket.emit("stopTyping", {
                conversationId: selectedConversation._id,
                userId: currentUserId,
            });
            setIsTyping(false);
        }

        const result = await dispatch(
            sendMessage({
                conversationId: selectedConversation._id,
                text: messageText,
            })
        );

        if (result.meta.requestStatus === "fulfilled" && socket) {
            socket.emit("sendMessage", result.payload);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e) => {
        setText(e.target.value);
        if (!socket) return;

        if (!isTyping && e.target.value.trim()) {
            setIsTyping(true);
            socket.emit("typing", {
                conversationId: selectedConversation._id,
                userId: currentUserId,
                username: user.username,
            });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                socket.emit("stopTyping", {
                    conversationId: selectedConversation._id,
                    userId: currentUserId,
                });
                setIsTyping(false);
            }
        }, 1500);
    };

    return (
        <main style={styles.window}>
            {/* Header */}
            <div style={styles.chatHeader}>
                {isMobile && (
                    <button
                        onClick={() => dispatch(showMobileSidebar())}
                        style={styles.backBtn}
                        title="Back"
                    >
                        <ArrowLeft size={22} strokeWidth={2} />
                    </button>
                )}
                <div style={styles.headerAvatar}>
                    {otherUser?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={styles.headerInfo}>
                    <div style={styles.headerName}>{otherUser?.name}</div>
                    <div style={styles.headerStatus}>
                        {otherUserTyping ? (
                            <span style={styles.typingStatus}>
                                {otherUser?.name} is typing...
                            </span>
                        ) : (
                            "Online"
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={styles.messagesArea}>
                {messages.length === 0 ? (
                    <div style={styles.noMessages}>
                        <p>Say hi to {otherUser?.name}! 👋</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = isOwnMessage(msg);
                        return (
                            <div
                                key={msg._id}
                                style={{
                                    ...styles.messageRow,
                                    justifyContent: isOwn ? "flex-end" : "flex-start",
                                }}
                            >
                                <div
                                    style={{
                                        ...styles.bubble,
                                        background: isOwn
                                            ? "linear-gradient(135deg, #4d6bfe, #6366f1)"
                                            : "#ffffff",
                                        color: isOwn ? "#fff" : "#1a1a1a",
                                        borderRadius: isOwn
                                            ? "16px 16px 4px 16px"
                                            : "16px 16px 16px 4px",
                                        boxShadow: isOwn
                                            ? "0 2px 8px rgba(77,107,254,0.25)"
                                            : "0 1px 3px rgba(0,0,0,0.08)",
                                    }}
                                >
                                    {msg.text}
                                    <div
                                        style={{
                                            ...styles.time,
                                            color: isOwn ? "rgba(255,255,255,0.7)" : "#9ca3af",
                                        }}
                                    >
                                        {new Date(msg.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={styles.inputArea}>
                <div style={styles.inputWrapper}>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        style={styles.messageInput}
                        autoFocus
                    />
                    <button
                        onClick={handleSend}
                        style={{
                            ...styles.sendBtn,
                            opacity: !text.trim() || isSending ? 0.5 : 1,
                            cursor: !text.trim() || isSending ? "not-allowed" : "pointer",
                        }}
                        disabled={!text.trim() || isSending}
                    >
                        <Send size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </main>
    );
};

const styles = {
    window: {
        flex: 1,
        height: "100vh",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    emptyState: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        maxWidth: "400px",
        margin: "0 auto",
    },
    iconWrapper: {
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "24px",
    },
    logoImg: { width: "80px", height: "80px", objectFit: "contain" },
    title: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: "8px",
        letterSpacing: "-0.5px",
    },
    subtitle: { color: "#64748b", fontSize: "15px", lineHeight: "1.6" },
    chatHeader: {
        padding: "12px 20px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    backBtn: {
        background: "transparent",
        border: "none",
        padding: "6px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "#4d6bfe",
        flexShrink: 0,
        marginRight: "4px",
    },
    headerAvatar: {
        width: "42px",
        height: "42px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4d6bfe, #6366f1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "16px",
        flexShrink: 0,
    },
    headerInfo: { flex: 1 },
    headerName: { fontSize: "15px", fontWeight: "600", color: "#1a1a1a" },
    headerStatus: { fontSize: "12px", color: "#22c55e", marginTop: "2px" },
    typingStatus: { color: "#4d6bfe", fontStyle: "italic" },
    messagesArea: {
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    noMessages: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9ca3af",
        fontSize: "14px",
    },
    messageRow: { display: "flex", width: "100%" },
    bubble: {
        maxWidth: "70%",
        padding: "10px 14px",
        fontSize: "14px",
        lineHeight: "1.5",
        wordWrap: "break-word",
    },
    time: { fontSize: "10px", marginTop: "4px", textAlign: "right" },
    inputArea: {
        padding: "12px 16px",
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
    },
    inputWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "24px",
        padding: "6px 6px 6px 18px",
    },
    messageInput: {
        flex: 1,
        border: "none",
        background: "transparent",
        fontSize: "14px",
        color: "#1a1a1a",
        padding: "8px 0",
        outline: "none",
    },
    sendBtn: {
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4d6bfe, #6366f1)",
        border: "none",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(77,107,254,0.35)",
        transition: "opacity 0.15s",
    },
};

export default ChatWindow;