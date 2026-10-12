import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Users, Trash2 } from "lucide-react";
import { logout } from "../redux/authSlice";
import {
    fetchUsers,
    fetchConversations,
    searchUsers,
    createConversation,
    fetchMessages,
    markConversationRead,
    clearUnreadForUser,
    setSelectedConversation,
    resetChat,
    deleteConversationThunk,
} from "../redux/chatSlice";
import CreateGroupModal from "./CreateGroupModal";
import SidebarMenu from "./SidebarMenu";
import ProfileModal from "./ProfileModal";
import SettingsModal from "./SettingsModal";

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { users, isLoading, unreadCounts, conversations, messages } =
        useSelector((state) => state.chat);
    const [searchTerm, setSearchTerm] = useState("");
    const [hoveredId, setHoveredId] = useState(null);
    const [activeUserId, setActiveUserId] = useState(null);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [menuState, setMenuState] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [contextMenu, setContextMenu] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchConversations());
    }, [dispatch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.trim()) {
                dispatch(searchUsers(searchTerm));
            } else {
                dispatch(fetchUsers());
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, dispatch]);

    useEffect(() => {
        if (messages.length > 0) {
            dispatch(fetchConversations());
        }
    }, [messages.length, dispatch]);

    const currentUserId = user?._id || user?.id;

    const handleLogout = () => {
        dispatch(logout());
        dispatch(resetChat());
        navigate("/login");
    };

    const handleConversationClick = async (conv) => {
        setActiveUserId(conv._id);
        dispatch(setSelectedConversation(conv));
        dispatch(fetchMessages(conv._id));

        if (conv.type === "private") {
            const otherUser = conv.members?.find(
                (m) => String(m._id) !== String(currentUserId)
            );
            if (otherUser && unreadCounts[otherUser._id]) {
                dispatch(
                    markConversationRead({
                        conversationId: conv._id,
                        otherUserId: otherUser._id,
                    })
                );
                dispatch(clearUnreadForUser(otherUser._id));
            }
        }
    };

    const handleOpenMenu = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuState({
            x: rect.right - 220,
            y: rect.bottom + 8,
        });
    };

    const handleDeleteConversation = async () => {
        if (!deleteConfirm) return;
        const convId = deleteConfirm._id;
        setDeleteConfirm(null);
        await dispatch(deleteConversationThunk(convId));
    };

    const formatBadge = (count) => {
        if (count > 99) return "99+";
        return count.toString();
    };

    const formatTime = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffHrs = diffMs / (1000 * 60 * 60);

        if (diffHrs < 24) {
            return d.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } else if (diffHrs < 48) {
            return "Yesterday";
        } else {
            return d.toLocaleDateString([], {
                day: "2-digit",
                month: "short",
            });
        }
    };

    const getConvUnreadCount = (conv) => {
        if (conv.type === "group") {
            return unreadCounts[conv._id] || 0;
        }
        const otherUser = conv.members?.find(
            (m) => String(m._id) !== String(currentUserId)
        );
        return otherUser ? unreadCounts[otherUser._id] || 0 : 0;
    };

    const getConvDisplayName = (conv) => {
        if (conv.type === "group") return conv.name || "Group";
        const otherUser = conv.members?.find(
            (m) => String(m._id) !== String(currentUserId)
        );
        return otherUser?.name || "Unknown";
    };

    const getLastMessagePreview = (conv) => {
        const lm = conv.lastMessage;
        if (!lm)
            return { text: "No messages yet", isOwn: false, isDeleted: false };

        const isOwn =
            String(lm.sender?._id || lm.sender) === String(currentUserId);
        const senderName =
            conv.type === "group" && !isOwn
                ? `${lm.sender?.name}: `
                : isOwn
                    ? "You: "
                    : "";

        return {
            text: `${senderName}${lm.text || ""}`,
            isOwn,
            isDeleted: lm.isDeleted,
        };
    };

    const getFilteredConversations = () => {
        let filtered = [...conversations];

        if (activeTab === "unread") {
            filtered = filtered.filter((c) => getConvUnreadCount(c) > 0);
        } else if (activeTab === "groups") {
            filtered = filtered.filter((c) => c.type === "group");
        } else if (activeTab === "favourites") {
            filtered = filtered.filter((c) =>
                (c.favourites || []).some((id) => String(id) === String(currentUserId))
            );
        }

        if (searchTerm.trim()) {
            filtered = filtered.filter((c) => {
                const name = getConvDisplayName(c);
                return name.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        return filtered;
    };

    const filteredConversations = getFilteredConversations();
    const hasConversations = conversations.length > 0;

    const filteredUsers = users.filter(
        (u) =>
            !searchTerm ||
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { id: "all", label: "All" },
        { id: "unread", label: "Unread" },
        { id: "groups", label: "Groups" },
        { id: "favourites", label: "Favourites" },
    ];

    return (
        <>
            <aside style={styles.sidebar}>
                {/* Header */}
                <div style={styles.header}>
                    <img src="/logo.png" alt="Logo" style={styles.brandLogo} />
                    <button onClick={handleOpenMenu} style={styles.menuBtn} title="Menu">
                        <MoreVertical size={22} color="#6b7280" strokeWidth={2} />
                    </button>
                </div>

                {/* Search */}
                <div style={styles.searchWrapper}>
                    <div style={styles.searchBox}>
                        <Search
                            size={16}
                            color="#9ca3af"
                            strokeWidth={2}
                            style={styles.searchIcon}
                        />
                        <input
                            type="text"
                            placeholder="Search or start a new chat"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Tabs */}
                {hasConversations && (
                    <div style={styles.tabsWrapper}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    ...styles.tab,
                                    background: activeTab === tab.id ? "#d1fae5" : "#ffffff",
                                    color: activeTab === tab.id ? "#059669" : "#64748b",
                                    border: `1px solid ${activeTab === tab.id ? "#a7f3d0" : "#e5e7eb"
                                        }`,
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Conversations List */}
                {hasConversations ? (
                    <div style={styles.list}>
                        {filteredConversations.length === 0 && (
                            <div style={styles.stateText}>
                                {activeTab === "unread"
                                    ? "No unread chats"
                                    : activeTab === "groups"
                                        ? "No groups yet"
                                        : activeTab === "favourites"
                                            ? "No favourites yet"
                                            : "No chats found"}
                            </div>
                        )}

                        {filteredConversations.map((conv) => {
                            const isActive = activeUserId === conv._id;
                            const isHovered = hoveredId === conv._id;
                            const unreadCount = getConvUnreadCount(conv);
                            const hasUnread = unreadCount > 0;
                            const displayName = getConvDisplayName(conv);
                            const preview = getLastMessagePreview(conv);
                            const isGroup = conv.type === "group";
                            const lastMsgTime = conv.lastMessage?.createdAt || conv.updatedAt;

                            return (
                                <div
                                    key={conv._id}
                                    style={{
                                        ...styles.userItem,
                                        background: isActive
                                            ? "#eef2ff"
                                            : isHovered
                                                ? "#f9fafb"
                                                : "transparent",
                                        borderLeft: isActive
                                            ? "3px solid #4d6bfe"
                                            : "3px solid transparent",
                                    }}
                                    onMouseEnter={() => setHoveredId(conv._id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => handleConversationClick(conv)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setContextMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            conv,
                                        });
                                    }}
                                >
                                    <div
                                        style={{
                                            ...styles.smallAvatar,
                                            background: isGroup
                                                ? "linear-gradient(135deg, #8b5cf6, #a855f7)"
                                                : "linear-gradient(135deg, #4d6bfe, #6366f1)",
                                        }}
                                    >
                                        {isGroup ? (
                                            <Users size={18} color="#fff" strokeWidth={2} />
                                        ) : (
                                            displayName?.charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    <div style={styles.itemInfo}>
                                        <div style={styles.nameRow}>
                                            <div
                                                style={{
                                                    ...styles.itemName,
                                                    color: isActive ? "#4d6bfe" : "#1a1a1a",
                                                    fontWeight: hasUnread ? "700" : "500",
                                                    flex: 1,
                                                }}
                                            >
                                                {displayName}
                                            </div>
                                            <div
                                                style={{
                                                    ...styles.timeText,
                                                    color: hasUnread ? "#4d6bfe" : "#9ca3af",
                                                }}
                                            >
                                                {formatTime(lastMsgTime)}
                                            </div>
                                        </div>

                                        <div style={styles.previewRow}>
                                            <div
                                                style={{
                                                    ...styles.itemUsername,
                                                    color: hasUnread ? "#4d6bfe" : "#9ca3af",
                                                    fontWeight: hasUnread ? "600" : "400",
                                                    flex: 1,
                                                }}
                                            >
                                                {preview.isDeleted ? (
                                                    <em>This message was deleted</em>
                                                ) : (
                                                    preview.text
                                                )}
                                            </div>
                                            {hasUnread && (
                                                <div style={styles.badge}>
                                                    {formatBadge(unreadCount)}
                                                </div>
                                            )}
                                            {isHovered && !hasUnread && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirm(conv);
                                                    }}
                                                    style={styles.deleteBtn}
                                                    title="Delete chat"
                                                >
                                                    <Trash2 size={14} color="#ef4444" strokeWidth={2} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        <div style={styles.sectionLabel}>Start a conversation</div>
                        <div style={styles.list}>
                            {isLoading && !filteredUsers.length && (
                                <div style={styles.stateText}>Loading...</div>
                            )}

                            {filteredUsers.map((u) => (
                                <div
                                    key={u._id}
                                    style={{
                                        ...styles.userItem,
                                        background:
                                            hoveredId === u._id ? "#f9fafb" : "transparent",
                                    }}
                                    onMouseEnter={() => setHoveredId(u._id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => {
                                        dispatch(createConversation(u._id)).then((res) => {
                                            if (res.meta.requestStatus === "fulfilled") {
                                                dispatch(fetchMessages(res.payload._id));
                                            }
                                        });
                                    }}
                                >
                                    {u.profilePicture ? (
                                        <img
                                            src={u.profilePicture}
                                            alt={u.name}
                                            style={{
                                                width: "44px",
                                                height: "44px",
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <div style={styles.smallAvatar}>
                                            {u.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div style={styles.itemInfo}>
                                        <div style={styles.itemName}>{u.name}</div>
                                        <div style={styles.itemUsername}>@{u.username}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Bottom Profile — Clickable */}
                <div style={styles.bottomProfile}>
                    <div
                        style={styles.profileCard}
                        onClick={() => setShowProfileModal(true)}
                    >
                        {user?.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt="Profile"
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    flexShrink: 0,
                                }}
                            />
                        ) : (
                            <div style={styles.avatar}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={styles.userInfo}>
                            <div style={styles.userName}>{user?.name}</div>
                            <div style={styles.userUsername}>@{user?.username}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Sidebar 3-dot Menu */}
            {menuState && (
                <SidebarMenu
                    x={menuState.x}
                    y={menuState.y}
                    onClose={() => setMenuState(null)}
                    onNewGroup={() => setShowGroupModal(true)}
                    onNewChat={() => {
                        setSearchTerm("");
                        setActiveTab("all");
                        dispatch(fetchUsers());
                    }}
                    onProfile={() => setShowProfileModal(true)}
                    onSettings={() => setShowSettingsModal(true)}
                    onLogout={handleLogout}
                />
            )}

            {/* Right-click Context Menu */}
            {contextMenu && (
                <div
                    style={{
                        position: "fixed",
                        top: contextMenu.y,
                        left: contextMenu.x,
                        background: "#fff",
                        borderRadius: "10px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                        padding: "6px",
                        zIndex: 2100,
                        minWidth: "180px",
                        border: "1px solid #e5e7eb",
                    }}
                    onMouseLeave={() => setContextMenu(null)}
                >
                    <button
                        onClick={() => {
                            setDeleteConfirm(contextMenu.conv);
                            setContextMenu(null);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            width: "100%",
                            padding: "10px 12px",
                            background: "transparent",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#ef4444",
                            fontFamily: "inherit",
                        }}
                    >
                        <Trash2 size={16} color="#ef4444" strokeWidth={2} />
                        <span>Delete chat</span>
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
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
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "16px",
                            padding: "24px",
                            maxWidth: "360px",
                            width: "90%",
                            textAlign: "center",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
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
                            <Trash2 size={26} color="#ef4444" strokeWidth={2} />
                        </div>
                        <h3
                            style={{
                                fontSize: "17px",
                                fontWeight: "700",
                                color: "#0f172a",
                                marginBottom: "8px",
                            }}
                        >
                            Delete chat?
                        </h3>
                        <p
                            style={{
                                fontSize: "14px",
                                color: "#64748b",
                                marginBottom: "20px",
                                lineHeight: "1.5",
                            }}
                        >
                            This will permanently delete this chat and all its messages. This
                            action cannot be undone.
                        </p>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
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
                                onClick={handleDeleteConversation}
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
                                    boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Modal */}
            {showGroupModal && (
                <CreateGroupModal onClose={() => setShowGroupModal(false)} />
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <ProfileModal onClose={() => setShowProfileModal(false)} />
            )}
            {/* Settings Modal */}
            {showSettingsModal && (
                <SettingsModal
                    onClose={() => setShowSettingsModal(false)}
                    onLogout={handleLogout}
                    onProfile={() => {
                        setShowSettingsModal(false);
                        setShowProfileModal(true);
                    }}
                />
            )}
        </>
    );
};

const styles = {
    sidebar: {
        width: "100%",
        height: "100%",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "background 0.3s ease",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 16px 12px 16px",
        borderBottom: "1px solid var(--border-light)",
    },
    brandLogo: {
        width: "180px",
        height: "auto",
        maxHeight: "56px",
        objectFit: "contain",
    },
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
    searchWrapper: {
        padding: "12px 16px 8px 16px",
    },
    searchBox: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    searchIcon: {
        position: "absolute",
        left: "14px",
        pointerEvents: "none",
    },
    searchInput: {
        width: "100%",
        padding: "11px 14px 11px 40px",
        background: "var(--bg-input)",
        border: "1px solid transparent",
        borderRadius: "999px",
        color: "var(--text-primary)",
        fontSize: "14px",
        outline: "none",
        transition: "background 0.2s, color 0.2s",
    },
    tabsWrapper: {
        display: "flex",
        gap: "8px",
        padding: "8px 16px 12px 16px",
        overflowX: "auto",
    },
    tab: {
        padding: "7px 16px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
    },
    sectionLabel: {
        padding: "8px 20px 6px 20px",
        fontSize: "11px",
        fontWeight: "600",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    list: {
        flex: 1,
        overflowY: "auto",
        paddingBottom: "10px",
    },
    stateText: {
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "13px",
        padding: "30px 20px",
    },
    userItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        margin: "0 8px",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "background 0.15s",
    },
    smallAvatar: {
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "16px",
        flexShrink: 0,
    },
    itemInfo: { flex: 1, minWidth: 0 },
    nameRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        marginBottom: "2px",
    },
    previewRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
    },
    itemName: {
        fontSize: "14.5px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    timeText: {
        fontSize: "11.5px",
        fontWeight: "500",
        flexShrink: 0,
    },
    itemUsername: {
        fontSize: "12.5px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    badge: {
        background: "var(--accent)",
        color: "#fff",
        fontSize: "11px",
        fontWeight: "700",
        minWidth: "20px",
        height: "20px",
        padding: "0 6px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    deleteBtn: {
        background: "transparent",
        border: "none",
        padding: "4px",
        borderRadius: "6px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginLeft: "6px",
    },
    bottomProfile: {
        padding: "12px",
        borderTop: "1px solid var(--border-color)",
    },
    profileCard: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "10px",
        background: "var(--bg-hover)",
        cursor: "pointer",
        transition: "background 0.15s",
    },
    avatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "14px",
        flexShrink: 0,
    },
    userInfo: { flex: 1, minWidth: 0 },
    userName: {
        fontSize: "13.5px",
        fontWeight: "600",
        color: "var(--text-primary)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userUsername: {
        fontSize: "11.5px",
        color: "var(--text-muted)",
        marginTop: "1px",
    },
};
export default Sidebar;