import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { sendMessage } from "../redux/chatSlice";

const ChatWindow = () => {
    const dispatch = useDispatch();
    const { selectedConversation, messages, isSending } = useSelector(
        (state) => state.chat
    );
    const { user } = useSelector((state) => state.auth);
    const [text, setText] = useState("");
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Empty state
    if (!selectedConversation) {
        return (
            <main style={styles.window}>
                <div style={styles.emptyState}>
                    <div style={styles.iconWrapper}>
                        <img src="/convo-logo.png" alt="NauChat" style={styles.logoImg} />
                    </div>
                    <h2 style={styles.title}>Welcome to NauChat</h2>
                    <p style={styles.subtitle}>
                        Select a user from the sidebar to start a conversation
                    </p>
                </div>
            </main>
        );
    }

    const otherUser = selectedConversation.members?.find(
        (m) => m._id !== user._id
    );

    const handleSend = () => {
        if (!text.trim() || isSending) return;
        dispatch(
            sendMessage({
                conversationId: selectedConversation._id,
                text: text.trim(),
            })
        );
        setText("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <main style={styles.window}>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
                <div style={styles.headerAvatar}>
                    {otherUser?.name?.charAt(0).toUpperCase()}
                    <span style={styles.headerOnlineDot} />
                </div>
                <div style={styles.headerInfo}>
                    <div style={styles.headerName}>{otherUser?.name}</div>
                    <div style={styles.headerStatus}>🟢 Online</div>
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
                        const isOwn = msg.sender?._id === user._id;
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
                        onChange={(e) => setText(e.target.value)}
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
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
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
        padding: "16px 24px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    headerAvatar: {
        position: "relative",
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
    headerOnlineDot: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "#22c55e",
        border: "2px solid #ffffff",
    },
    headerInfo: { flex: 1 },
    headerName: { fontSize: "15px", fontWeight: "600", color: "#1a1a1a" },
    headerStatus: { fontSize: "12px", color: "#22c55e", marginTop: "2px" },
    messagesArea: {
        flex: 1,
        overflowY: "auto",
        padding: "24px",
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
        maxWidth: "60%",
        padding: "10px 14px",
        fontSize: "14px",
        lineHeight: "1.5",
        wordWrap: "break-word",
    },
    time: { fontSize: "10px", marginTop: "4px", textAlign: "right" },
    inputArea: {
        padding: "16px 24px",
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
        padding: "6px 6px 6px 20px",
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