import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, Send, Users, Trash2, Check, CheckCheck } from "lucide-react";
import {
    sendMessage,
    showMobileSidebar,
    deleteConversationThunk,
} from "../redux/chatSlice";
import { useSocket } from "../context/SocketContext";
import useIsMobile from "../hooks/useIsMobile";
import API from "../services/api";
import GroupInfoModal from "./GroupInfoModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

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
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [readMessages, setReadMessages] = useState(new Set());
    const [deliveredMessages, setDeliveredMessages] = useState(new Set());
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Mark all incoming as delivered + read when chat opens
    useEffect(() => {
        if (!selectedConversation || !socket || !user) return;

        const currentUserId = user._id || user.id;

        // Delivered
        socket.emit("messagesDelivered", {
            conversationId: selectedConversation._id,
            readerId: currentUserId,
        });

        fetch(`${API.defaults.baseURL}/messages/${selectedConversation._id}/delivered`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${JSON.parse(localStorage.getItem("userInfo")).token
                    }`,
            },
        }).catch(() => { });

        // Read
        socket.emit("messagesRead", {
            conversationId: selectedConversation._id,
            readerId: currentUserId,
        });

        fetch(`${API.defaults.baseURL}/messages/${selectedConversation._id}/read`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${JSON.parse(localStorage.getItem("userInfo")).token
                    }`,
            },
        }).catch(() => { });
    }, [selectedConversation, socket, user]);

    // Listen for typing + read + delivered
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

        const handleMessagesRead = ({ conversationId }) => {
            if (conversationId !== selectedConversation?._id) return;
            const ownIds = messages
                .filter((m) => {
                    const sid =
                        typeof m.sender === "object" ? m.sender?._id : m.sender;
                    return String(sid) === String(user._id || user.id);
                })
                .map((m) => m._id);
            setReadMessages(new Set(ownIds));
        };

        const handleMessagesDelivered = ({ conversationId, messageId }) => {
            if (conversationId !== selectedConversation?._id) return;

            if (messageId) {
                setDeliveredMessages((prev) => new Set(prev).add(messageId));
            } else {
                const ownIds = messages
                    .filter((m) => {
                        const sid =
                            typeof m.sender === "object" ? m.sender?._id : m.sender;
                        return String(sid) === String(user._id || user.id);
                    })
                    .map((m) => m._id);
                setDeliveredMessages(new Set(ownIds));
            }
        };

        socket.on("userTyping", handleUserTyping);
        socket.on("userStoppedTyping", handleUserStoppedTyping);
        socket.on("messagesRead", handleMessagesRead);
        socket.on("messagesDelivered", handleMessagesDelivered);

        return () => {
            socket.off("userTyping", handleUserTyping);
            socket.off("userStoppedTyping", handleUserStoppedTyping);
            socket.off("messagesRead", handleMessagesRead);
            socket.off("messagesDelivered", handleMessagesDelivered);
        };
    }, [socket, user, selectedConversation, messages]);

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
    const isGroup = selectedConversation.type === "group";

    const otherUser = !isGroup
        ? selectedConversation.members?.find(
            (m) => String(m._id) !== String(currentUserId)
        )
        : null;

    const headerName = isGroup ? selectedConversation.name : otherUser?.name;
    const headerAvatarLetter = isGroup
        ? selectedConversation.name?.charAt(0).toUpperCase()
        : otherUser?.name?.charAt(0).toUpperCase();
    const headerStatus = isGroup
        ? `${selectedConversation.members?.length || 0} members`
        : "Online";

    const isOwnMessage = (msg) => {
        if (!msg.sender) return false;
        const senderId =
            typeof msg.sender === "object"
                ? msg.sender._id || msg.sender.id
                : msg.sender;
        if (!senderId || !currentUserId) return false;
        return String(senderId) === String(currentUserId);
    };

    // WhatsApp-style tick renderer
    const renderTicks = (msg) => {
        const msgId = msg._id;

        // Priority 1: Read (blue double tick)
        const isRead = msg.isRead || readMessages.has(msgId);
        if (isRead) {
            return (
                <CheckCheck
                    size={14}
                    color="#53bdeb"
                    strokeWidth={2.5}
                    style={styles.tick}
                />
            );
        }

        // Priority 2: Delivered (grey double tick)
        const isDelivered = msg.deliveredAt || deliveredMessages.has(msgId);
        if (isDelivered) {
            return (
                <CheckCheck
                    size={14}
                    color="rgba(255,255,255,0.7)"
                    strokeWidth={2.5}
                    style={styles.tick}
                />
            );
        }

        // Priority 3: Sent (single grey tick)
        return (
            <Check
                size={14}
                color="rgba(255,255,255,0.7)"
                strokeWidth={2.5}
                style={styles.tick}
            />
        );
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

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Remove this member from the group?")) return;

        try {
            const response = await fetch(
                `${API.defaults.baseURL}/conversations/${selectedConversation._id}/remove-member`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${JSON.parse(localStorage.getItem("userInfo")).token
                            }`,
                    },
                    body: JSON.stringify({ memberId }),
                }
            );

            if (response.ok) {
                const updatedGroup = await response.json();
                dispatch({
                    type: "chat/setSelectedConversation",
                    payload: updatedGroup,
                });
                window.location.reload();
            } else {
                const err = await response.json();
                alert(err.message || "Failed to remove member");
            }
        } catch (err) {
            alert("Network error");
        }
    };

    return (
        <main style={styles.window}>
            {/* Chat Header */}
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

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flex: 1,
                        cursor: isGroup ? "pointer" : "default",
                    }}
                    onClick={() => {
                        if (isGroup) setShowGroupInfo(true);
                    }}
                >
                    <div
                        style={{
                            ...styles.headerAvatar,
                            background: isGroup
                                ? "linear-gradient(135deg, #8b5cf6, #a855f7)"
                                : "linear-gradient(135deg, #4d6bfe, #6366f1)",
                        }}
                    >
                        {isGroup ? (
                            <Users size={20} color="#fff" strokeWidth={2} />
                        ) : (
                            headerAvatarLetter
                        )}
                    </div>
                    <div style={styles.headerInfo}>
                        <div style={styles.headerName}>{headerName}</div>
                        <div
                            style={{
                                ...styles.headerStatus,
                                color: isGroup ? "#8b5cf6" : "#22c55e",
                            }}
                        >
                            {otherUserTyping ? (
                                <span style={styles.typingStatus}>
                                    {otherUser?.name} is typing...
                                </span>
                            ) : (
                                headerStatus
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={styles.menuBtn}
                    title="Delete conversation"
                >
                    <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                </button>
            </div>

            {/* Messages */}
            <div style={styles.messagesArea}>
                {messages.length === 0 ? (
                    <div style={styles.noMessages}>
                        <p>Say hi to {headerName}! 👋</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = isOwnMessage(msg);
                        const senderName =
                            typeof msg.sender === "object" ? msg.sender?.name : null;

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
                                    {isGroup && !isOwn && senderName && (
                                        <div style={styles.senderName}>{senderName}</div>
                                    )}
                                    {msg.text}
                                    <div style={styles.timeRow}>
                                        <span
                                            style={{
                                                ...styles.time,
                                                color: isOwn ? "rgba(255,255,255,0.7)" : "#9ca3af",
                                            }}
                                        >
                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        {isOwn && renderTicks(msg)}
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

            {/* Group Info Modal */}
            {showGroupInfo && isGroup && (
                <GroupInfoModal
                    group={selectedConversation}
                    onClose={() => setShowGroupInfo(false)}
                    onRemoveMember={handleRemoveMember}
                />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <DeleteConfirmModal
                    title={isGroup ? "Delete group?" : "Delete chat?"}
                    message={
                        isGroup
                            ? "This will permanently delete the group and all its messages for everyone."
                            : "This will delete all messages in this conversation. This action cannot be undone."
                    }
                    confirmText="Delete"
                    onCancel={() => setShowDeleteConfirm(false)}
                    onConfirm={() => {
                        dispatch(deleteConversationThunk(selectedConversation._id));
                        setShowDeleteConfirm(false);
                    }}
                />
            )}
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
    headerStatus: { fontSize: "12px", marginTop: "2px" },
    typingStatus: { color: "#4d6bfe", fontStyle: "italic" },
    menuBtn: {
        background: "transparent",
        border: "none",
        padding: "8px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
    },
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
    senderName: {
        fontSize: "11px",
        fontWeight: "700",
        color: "#4d6bfe",
        marginBottom: "4px",
    },
    timeRow: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        justifyContent: "flex-end",
        marginTop: "4px",
    },
    time: { fontSize: "10px" },
    tick: { marginLeft: "2px" },
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