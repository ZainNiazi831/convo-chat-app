import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    ArrowLeft,
    Send,
    Users,
    Trash2,
    Check,
    CheckCheck,
    Ban,
    X,
    Reply as ReplyIcon,
    Smile,
    MoreVertical,
    Star,
    Eraser,
    BellOff,
} from "lucide-react";
import {
    sendMessage,
    showMobileSidebar,
    deleteConversationThunk,
    deleteMessageForMe,
    deleteMessageForEveryone,
    toggleReaction,
    toggleFavouriteThunk,
    clearChatThunk,
    toggleMuteThunk,
    optimisticToggleFavourite,
} from "../redux/chatSlice";
import { useSocket } from "../context/SocketContext";
import useIsMobile from "../hooks/useIsMobile";
import API from "../services/api";
import GroupInfoModal from "./GroupInfoModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import MessageMenu from "./MessageMenu";
import MessageInfoModal from "./MessageInfoModal";
import EmojiPicker from "./EmojiPicker";

const ChatWindow = () => {
    const dispatch = useDispatch();
    const { socket } = useSocket();
    const isMobile = useIsMobile();
    const { selectedConversation, messages, isSending, conversations } =
        useSelector((state) => state.chat);
    const { user } = useSelector((state) => state.auth);
    const [text, setText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [readMessages, setReadMessages] = useState(new Set());
    const [deliveredMessages, setDeliveredMessages] = useState(new Set());
    const [menuState, setMenuState] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);
    const [emojiPicker, setEmojiPicker] = useState(null);
    const [hoveredMsgId, setHoveredMsgId] = useState(null);
    const [chatMenu, setChatMenu] = useState(null);
    const [clearConfirm, setClearConfirm] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    const currentUserId = user?._id || user?.id;

    // ⭐ Get fresh favourite state from Redux conversations
    const currentConv = conversations.find(
        (c) => c._id === selectedConversation?._id
    );
    const isFavourite = currentConv?.favourites?.some(
        (id) => String(id) === String(currentUserId)
    );
    const isMuted = currentConv?._muted || false;

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Mark delivered + read when chat opens
    useEffect(() => {
        if (!selectedConversation || !socket || !user) return;

        socket.emit("messagesDelivered", {
            conversationId: selectedConversation._id,
            readerId: currentUserId,
        });

        fetch(
            `${API.defaults.baseURL}/messages/${selectedConversation._id}/delivered`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${JSON.parse(localStorage.getItem("userInfo")).token
                        }`,
                },
            }
        ).catch(() => { });

        socket.emit("messagesRead", {
            conversationId: selectedConversation._id,
            readerId: currentUserId,
        });

        fetch(
            `${API.defaults.baseURL}/messages/${selectedConversation._id}/read`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${JSON.parse(localStorage.getItem("userInfo")).token
                        }`,
                },
            }
        ).catch(() => { });
    }, [selectedConversation, socket, user, currentUserId]);

    // Listen typing + read + delivered
    useEffect(() => {
        if (!socket || !user) return;

        const handleUserTyping = ({ userId }) => {
            if (String(userId) !== String(currentUserId)) setOtherUserTyping(true);
        };

        const handleUserStoppedTyping = ({ userId }) => {
            if (String(userId) !== String(currentUserId)) setOtherUserTyping(false);
        };

        const handleMessagesRead = ({ conversationId }) => {
            if (conversationId !== selectedConversation?._id) return;
            const ownIds = messages
                .filter((m) => {
                    const sid = typeof m.sender === "object" ? m.sender?._id : m.sender;
                    return String(sid) === String(currentUserId);
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
                        return String(sid) === String(currentUserId);
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
    }, [socket, user, selectedConversation, messages, currentUserId]);

    useEffect(() => {
        setOtherUserTyping(false);
    }, [selectedConversation]);

    useEffect(() => {
        setReplyTo(null);
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

    const renderTicks = (msg) => {
        const msgId = msg._id;
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

        return (
            <Check
                size={14}
                color="rgba(255,255,255,0.7)"
                strokeWidth={2.5}
                style={styles.tick}
            />
        );
    };

    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        if (msg.isDeleted) return;
        setMenuState({ x: e.clientX, y: e.clientY, message: msg });
    };

    const handleCopy = () => {
        if (!menuState) return;
        navigator.clipboard.writeText(menuState.message.text);
        setMenuState(null);
    };

    const handleReply = () => {
        if (!menuState) return;
        setReplyTo(menuState.message);
        setMenuState(null);
        inputRef.current?.focus();
    };

    const handleInfo = () => {
        if (!menuState) return;
        setInfoMessage(menuState.message);
        setMenuState(null);
    };

    const handleDeleteForMe = async () => {
        if (!menuState) return;
        const msgId = menuState.message._id;
        setMenuState(null);
        dispatch(deleteMessageForMe(msgId));
    };

    const handleDeleteForEveryone = async () => {
        if (!menuState) return;
        const msg = menuState.message;
        setMenuState(null);

        const result = await dispatch(deleteMessageForEveryone(msg._id));
        if (result.meta.requestStatus === "fulfilled" && socket) {
            socket.emit("messageDeletedForEveryone", {
                conversationId: selectedConversation._id,
                message: result.payload,
            });
        }
    };

    const handleReaction = async (emoji, messageId) => {
        setEmojiPicker(null);
        const result = await dispatch(toggleReaction({ messageId, emoji }));
        if (result.meta.requestStatus === "fulfilled" && socket) {
            socket.emit("messageReacted", {
                conversationId: selectedConversation._id,
                message: result.payload,
            });
        }
    };

    const hasUserReacted = (msg, emoji) => {
        if (!msg.reactions) return false;
        const users = msg.reactions[emoji] || msg.reactions.get?.(emoji) || [];
        return users.some((id) => String(id) === String(currentUserId));
    };

    const getReactions = (msg) => {
        if (!msg.reactions) return [];
        const entries = msg.reactions.entries
            ? Array.from(msg.reactions.entries())
            : Object.entries(msg.reactions);
        return entries.map(([emoji, users]) => ({
            emoji,
            count: users.length,
            users,
        }));
    };

    const handleSend = async () => {
        if (!text.trim() || isSending) return;

        const messageText = text.trim();
        const replyToId = replyTo?._id || null;

        setText("");
        setReplyTo(null);

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
                replyTo: replyToId,
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
                    onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setChatMenu({
                            x: rect.right - 220,
                            y: rect.bottom + 8,
                        });
                    }}
                    style={styles.menuBtn}
                    title="Chat menu"
                >
                    <MoreVertical size={20} color="#6b7280" strokeWidth={2} />
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
                        const isDeleted = msg.isDeleted;
                        const reactions = getReactions(msg);
                        const showEmojiButton = hoveredMsgId === msg._id && !isDeleted;

                        return (
                            <div
                                key={msg._id}
                                style={{
                                    ...styles.messageRow,
                                    justifyContent: isOwn ? "flex-end" : "flex-start",
                                }}
                                onContextMenu={(e) => handleContextMenu(e, msg)}
                                onMouseEnter={() => setHoveredMsgId(msg._id)}
                                onMouseLeave={() => setHoveredMsgId(null)}
                            >
                                {showEmojiButton && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setEmojiPicker({
                                                x: isOwn ? rect.left - 330 : rect.right + 10,
                                                y: rect.top,
                                                messageId: msg._id,
                                            });
                                        }}
                                        style={{
                                            ...styles.emojiTrigger,
                                            marginRight: isOwn ? "8px" : "0",
                                            marginLeft: isOwn ? "0" : "8px",
                                            order: isOwn ? -1 : 1,
                                        }}
                                        title="React"
                                    >
                                        <Smile size={18} color="#6b7280" strokeWidth={2} />
                                    </button>
                                )}

                                <div
                                    style={{
                                        ...styles.bubble,
                                        background: isDeleted
                                            ? "#f1f5f9"
                                            : isOwn
                                                ? "linear-gradient(135deg, #4d6bfe, #6366f1)"
                                                : "#ffffff",
                                        color: isDeleted ? "#9ca3af" : isOwn ? "#fff" : "#1a1a1a",
                                        borderRadius: isOwn
                                            ? "16px 16px 4px 16px"
                                            : "16px 16px 16px 4px",
                                        boxShadow:
                                            isOwn && !isDeleted
                                                ? "0 2px 8px rgba(77,107,254,0.25)"
                                                : "0 1px 3px rgba(0,0,0,0.08)",
                                        fontStyle: isDeleted ? "italic" : "normal",
                                    }}
                                >
                                    {isGroup && !isOwn && senderName && !isDeleted && (
                                        <div style={styles.senderName}>{senderName}</div>
                                    )}

                                    {msg.replyTo && !isDeleted && (
                                        <div
                                            style={{
                                                ...styles.replyPreview,
                                                background: isOwn
                                                    ? "rgba(255,255,255,0.2)"
                                                    : "rgba(77,107,254,0.08)",
                                                borderLeft: `3px solid ${isOwn ? "rgba(255,255,255,0.9)" : "#4d6bfe"
                                                    }`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    ...styles.replyName,
                                                    color: isOwn ? "#fff" : "#4d6bfe",
                                                }}
                                            >
                                                {typeof msg.replyTo.sender === "object"
                                                    ? msg.replyTo.sender.name
                                                    : "User"}
                                            </div>
                                            <div
                                                style={{
                                                    ...styles.replyText,
                                                    color: isOwn
                                                        ? "rgba(255,255,255,0.85)"
                                                        : "#64748b",
                                                }}
                                            >
                                                {msg.replyTo.isDeleted
                                                    ? "This message was deleted"
                                                    : msg.replyTo.text?.slice(0, 60) || ""}
                                            </div>
                                        </div>
                                    )}

                                    {isDeleted ? (
                                        <div style={styles.deletedRow}>
                                            <Ban size={14} color="#9ca3af" strokeWidth={2} />
                                            <span>This message was deleted</span>
                                        </div>
                                    ) : (
                                        <>
                                            {msg.text}
                                            <div style={styles.timeRow}>
                                                <span
                                                    style={{
                                                        ...styles.time,
                                                        color: isOwn
                                                            ? "rgba(255,255,255,0.7)"
                                                            : "#9ca3af",
                                                    }}
                                                >
                                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                {isOwn && renderTicks(msg)}
                                            </div>
                                        </>
                                    )}

                                    {reactions.length > 0 && (
                                        <div
                                            style={{
                                                ...styles.reactionsRow,
                                                justifyContent: isOwn ? "flex-end" : "flex-start",
                                            }}
                                        >
                                            {reactions.map(({ emoji, count }) => {
                                                const isMine = hasUserReacted(msg, emoji);
                                                return (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(emoji, msg._id)}
                                                        style={{
                                                            ...styles.reactionBadge,
                                                            background: isMine
                                                                ? "#dbeafe"
                                                                : isOwn
                                                                    ? "rgba(255,255,255,0.25)"
                                                                    : "#f1f5f9",
                                                            border: `1px solid ${isMine ? "#4d6bfe" : "transparent"
                                                                }`,
                                                        }}
                                                        title={`${count} reaction${count > 1 ? "s" : ""}`}
                                                    >
                                                        <span style={styles.reactionEmoji}>{emoji}</span>
                                                        {count > 1 && (
                                                            <span
                                                                style={{
                                                                    ...styles.reactionCount,
                                                                    color: isMine ? "#4d6bfe" : "#64748b",
                                                                }}
                                                            >
                                                                {count}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Input Preview */}
            {replyTo && (
                <div style={styles.replyBar}>
                    <div style={styles.replyBarContent}>
                        <ReplyIcon
                            size={18}
                            color="#4d6bfe"
                            strokeWidth={2}
                            style={{ transform: "scaleX(-1)", flexShrink: 0 }}
                        />
                        <div style={styles.replyBarText}>
                            <div style={styles.replyBarName}>
                                {typeof replyTo.sender === "object"
                                    ? replyTo.sender.name
                                    : "You"}
                            </div>
                            <div style={styles.replyBarMessage}>
                                {replyTo.isDeleted
                                    ? "This message was deleted"
                                    : replyTo.text?.slice(0, 80)}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setReplyTo(null)}
                        style={styles.replyCloseBtn}
                    >
                        <X size={18} color="#6b7280" strokeWidth={2} />
                    </button>
                </div>
            )}

            {/* Input */}
            <div style={styles.inputArea}>
                <div style={styles.inputWrapper}>
                    <input
                        ref={inputRef}
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

            {/* Emoji Picker */}
            {emojiPicker && (
                <EmojiPicker
                    x={emojiPicker.x}
                    y={emojiPicker.y}
                    onSelect={(emoji) => handleReaction(emoji, emojiPicker.messageId)}
                    onClose={() => setEmojiPicker(null)}
                />
            )}

            {/* Chat 3-dot Menu */}
            {chatMenu && (
                <div
                    style={{
                        position: "fixed",
                        top: chatMenu.y,
                        left: chatMenu.x,
                        background: "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
                        padding: "6px",
                        zIndex: 2500,
                        minWidth: "220px",
                        border: "1px solid #e5e7eb",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            // ⚡ INSTANT optimistic update
                            dispatch(
                                optimisticToggleFavourite({
                                    conversationId: selectedConversation._id,
                                    userId: currentUserId,
                                })
                            );
                            // Backend save in background
                            dispatch(
                                toggleFavouriteThunk({
                                    conversationId: selectedConversation._id,
                                    userId: currentUserId,
                                })
                            );
                            setChatMenu(null);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            width: "100%",
                            padding: "11px 14px",
                            background: "transparent",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#1a1a1a",
                            fontFamily: "inherit",
                            textAlign: "left",
                        }}
                    >
                        <Star
                            size={18}
                            color="#f59e0b"
                            strokeWidth={2}
                            fill={isFavourite ? "#f59e0b" : "none"}
                        />
                        <span>
                            {isFavourite ? "Remove from favourites" : "Add to favourites"}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            dispatch(toggleMuteThunk(selectedConversation._id));
                            setChatMenu(null);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            width: "100%",
                            padding: "11px 14px",
                            background: "transparent",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#1a1a1a",
                            fontFamily: "inherit",
                            textAlign: "left",
                        }}
                    >
                        <BellOff size={18} color="#6b7280" strokeWidth={2} />
                        <span>{isMuted ? "Unmute notifications" : "Mute notifications"}</span>
                    </button>

                    <div
                        style={{ height: "1px", background: "#e5e7eb", margin: "4px 0" }}
                    />

                    <button
                        onClick={() => {
                            setClearConfirm(true);
                            setChatMenu(null);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            width: "100%",
                            padding: "11px 14px",
                            background: "transparent",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#ef4444",
                            fontFamily: "inherit",
                            textAlign: "left",
                        }}
                    >
                        <Eraser size={18} color="#ef4444" strokeWidth={2} />
                        <span>Clear chat</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowDeleteConfirm(true);
                            setChatMenu(null);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            width: "100%",
                            padding: "11px 14px",
                            background: "transparent",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#ef4444",
                            fontFamily: "inherit",
                            textAlign: "left",
                        }}
                    >
                        <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                        <span>Delete chat</span>
                    </button>
                </div>
            )}

            {/* Clear Chat Confirm */}
            {clearConfirm && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 3000,
                    }}
                    onClick={() => setClearConfirm(false)}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "16px",
                            padding: "24px",
                            maxWidth: "360px",
                            width: "90%",
                            textAlign: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                width: "56px",
                                height: "56px",
                                borderRadius: "50%",
                                background: "#fee2e2",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px auto",
                            }}
                        >
                            <Eraser size={26} color="#ef4444" strokeWidth={2} />
                        </div>
                        <h3
                            style={{
                                fontSize: "17px",
                                fontWeight: "700",
                                color: "#0f172a",
                                marginBottom: "8px",
                            }}
                        >
                            Clear chat?
                        </h3>
                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
                            This will clear all messages in this chat for you. Other members
                            will still see them.
                        </p>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={() => setClearConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: "11px",
                                    background: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "10px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#64748b",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await dispatch(clearChatThunk(selectedConversation._id));
                                    setClearConfirm(false);
                                }}
                                style={{
                                    flex: 1,
                                    padding: "11px",
                                    background: "#ef4444",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                }}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {menuState && (
                <MessageMenu
                    x={menuState.x}
                    y={menuState.y}
                    isOwn={isOwnMessage(menuState.message)}
                    message={menuState.message}
                    onCopy={handleCopy}
                    onReply={handleReply}
                    onInfo={handleInfo}
                    onDeleteForMe={handleDeleteForMe}
                    onDeleteForEveryone={handleDeleteForEveryone}
                    onClose={() => setMenuState(null)}
                />
            )}

            {/* Message Info Modal */}
            {infoMessage && (
                <MessageInfoModal
                    message={infoMessage}
                    onClose={() => setInfoMessage(null)}
                />
            )}

            {/* Group Info Modal */}
            {showGroupInfo && isGroup && (
                <GroupInfoModal
                    group={selectedConversation}
                    onClose={() => setShowGroupInfo(false)}
                    onRemoveMember={handleRemoveMember}
                />
            )}

            {/* Delete Conversation Confirmation */}
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
    messageRow: {
        display: "flex",
        width: "100%",
        alignItems: "center",
    },
    bubble: {
        maxWidth: "70%",
        padding: "10px 14px",
        fontSize: "14px",
        lineHeight: "1.5",
        wordWrap: "break-word",
        position: "relative",
    },
    senderName: {
        fontSize: "11px",
        fontWeight: "700",
        color: "#4d6bfe",
        marginBottom: "4px",
    },
    replyPreview: {
        padding: "6px 10px",
        borderRadius: "6px",
        marginBottom: "8px",
        borderLeft: "3px solid #4d6bfe",
        opacity: 0.95,
    },
    replyName: {
        fontSize: "11px",
        fontWeight: "700",
        marginBottom: "2px",
        color: "#4d6bfe",
    },
    replyText: {
        fontSize: "12px",
        color: "#64748b",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        lineHeight: "1.3",
    },
    deletedRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
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
    emojiTrigger: {
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        padding: "6px",
        borderRadius: "50%",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        transition: "transform 0.15s",
    },
    reactionsRow: {
        display: "flex",
        gap: "4px",
        marginTop: "6px",
        flexWrap: "wrap",
    },
    reactionBadge: {
        display: "flex",
        alignItems: "center",
        gap: "3px",
        padding: "2px 7px",
        borderRadius: "999px",
        cursor: "pointer",
        fontSize: "13px",
        transition: "transform 0.1s",
    },
    reactionEmoji: {
        fontSize: "14px",
        lineHeight: 1,
    },
    reactionCount: {
        fontSize: "11px",
        fontWeight: "600",
    },
    replyBar: {
        padding: "10px 16px 4px 16px",
        background: "#ffffff",
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
        borderTop: "1px solid #f3f4f6",
    },
    replyBarContent: {
        flex: 1,
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        background: "#f0f9ff",
        padding: "10px 12px",
        borderRadius: "10px",
        borderLeft: "4px solid #4d6bfe",
    },
    replyBarText: {
        flex: 1,
        minWidth: 0,
    },
    replyBarName: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#4d6bfe",
        marginBottom: "2px",
    },
    replyBarMessage: {
        fontSize: "12.5px",
        color: "#64748b",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        lineHeight: "1.3",
    },
    replyCloseBtn: {
        background: "transparent",
        border: "none",
        padding: "6px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
    },
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