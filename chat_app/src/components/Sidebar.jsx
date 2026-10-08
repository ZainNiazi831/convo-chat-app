import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, PlusCircle, LogOut, Users } from "lucide-react";
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
} from "../redux/chatSlice";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { users, isLoading, unreadCounts, conversations } = useSelector(
        (state) => state.chat
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [hoveredId, setHoveredId] = useState(null);
    const [activeUserId, setActiveUserId] = useState(null);
    const [showGroupModal, setShowGroupModal] = useState(false);

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

    const handleLogout = () => {
        dispatch(logout());
        dispatch(resetChat());
        navigate("/login");
    };

    // Private chat with a user
    const handleUserClick = async (clickedUser) => {
        setActiveUserId(clickedUser._id);
        const result = await dispatch(createConversation(clickedUser._id));
        if (result.meta.requestStatus === "fulfilled") {
            const conv = result.payload;
            dispatch(fetchMessages(conv._id));

            if (unreadCounts[clickedUser._id]) {
                dispatch(
                    markConversationRead({
                        conversationId: conv._id,
                        otherUserId: clickedUser._id,
                    })
                );
                dispatch(clearUnreadForUser(clickedUser._id));
            }
        }
    };

    // Group chat click
    const handleGroupClick = async (group) => {
        setActiveUserId(group._id);
        dispatch(setSelectedConversation(group));
        dispatch(fetchMessages(group._id));
    };

    const formatBadge = (count) => {
        if (count > 99) return "99+";
        return count.toString();
    };

    // Filter groups from conversations
    const groups = conversations.filter((c) => c.type === "group");

    // Filter users by search
    const filteredUsers = users.filter(
        (u) =>
            !searchTerm ||
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <aside style={styles.sidebar}>
                {/* Header */}
                <div style={styles.header}>
                    <img src="/logo.png" alt="Logo" style={styles.brandLogo} />
                    <button style={styles.iconBtn} title="Search">
                        <Search size={20} color="#6b7280" strokeWidth={2} />
                    </button>
                </div>

                {/* Actions: New Chat + New Group */}
                <div style={styles.actionsWrapper}>
                    <button style={styles.newChatBtn}>
                        <PlusCircle size={18} strokeWidth={2} />
                        New chat
                    </button>
                    <button
                        style={styles.newGroupBtn}
                        onClick={() => setShowGroupModal(true)}
                        title="Create group"
                    >
                        <Users size={18} strokeWidth={2} />
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
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Groups Section (if any) */}
                {groups.length > 0 && (
                    <>
                        <div style={styles.sectionLabel}>Groups</div>
                        <div style={styles.list}>
                            {groups.map((g) => {
                                const isActive = activeUserId === g._id;
                                const isHovered = hoveredId === g._id;
                                return (
                                    <div
                                        key={g._id}
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
                                        onMouseEnter={() => setHoveredId(g._id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={() => handleGroupClick(g)}
                                    >
                                        <div
                                            style={{
                                                ...styles.smallAvatar,
                                                background:
                                                    "linear-gradient(135deg, #8b5cf6, #a855f7)",
                                            }}
                                        >
                                            <Users size={18} color="#fff" strokeWidth={2} />
                                        </div>
                                        <div style={styles.itemInfo}>
                                            <div
                                                style={{
                                                    ...styles.itemName,
                                                    color: isActive ? "#4d6bfe" : "#1a1a1a",
                                                }}
                                            >
                                                {g.name}
                                            </div>
                                            <div style={styles.itemUsername}>
                                                {g.members?.length || 0} members
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Contacts Section */}
                <div style={styles.sectionLabel}>Contacts</div>
                <div style={styles.list}>
                    {isLoading && !filteredUsers.length && (
                        <div style={styles.stateText}>Loading...</div>
                    )}

                    {!isLoading && filteredUsers.length === 0 && (
                        <div style={styles.stateText}>
                            {searchTerm ? "No users found" : "No users yet"}
                        </div>
                    )}

                    {filteredUsers.map((u) => {
                        const isActive = activeUserId === u._id;
                        const isHovered = hoveredId === u._id;
                        const unreadCount = unreadCounts[u._id] || 0;
                        const hasUnread = unreadCount > 0;

                        return (
                            <div
                                key={u._id}
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
                                onMouseEnter={() => setHoveredId(u._id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => handleUserClick(u)}
                            >
                                <div style={styles.smallAvatar}>
                                    {u.name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={styles.itemInfo}>
                                    <div
                                        style={{
                                            ...styles.itemName,
                                            color: isActive ? "#4d6bfe" : "#1a1a1a",
                                            fontWeight: hasUnread ? "700" : "500",
                                        }}
                                    >
                                        {u.name}
                                    </div>
                                    <div
                                        style={{
                                            ...styles.itemUsername,
                                            color: hasUnread ? "#4d6bfe" : "#9ca3af",
                                            fontWeight: hasUnread ? "600" : "400",
                                        }}
                                    >
                                        {hasUnread
                                            ? `${formatBadge(unreadCount)} new message${unreadCount > 1 ? "s" : ""
                                            }`
                                            : `@${u.username}`}
                                    </div>
                                </div>
                                {hasUnread && (
                                    <div style={styles.badge}>{formatBadge(unreadCount)}</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Profile */}
                <div style={styles.bottomProfile}>
                    <div style={styles.profileCard}>
                        <div style={styles.avatar}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.userInfo}>
                            <div style={styles.userName}>{user?.name}</div>
                            <div style={styles.userUsername}>@{user?.username}</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={styles.logoutBtn}
                            title="Logout"
                        >
                            <LogOut size={16} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Group Modal */}
            {showGroupModal && (
                <CreateGroupModal onClose={() => setShowGroupModal(false)} />
            )}
        </>
    );
};

const styles = {
    sidebar: {
        width: "100%",
        height: "100%",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 12px",
        borderBottom: "1px solid #f3f4f6",
    },
    brandLogo: {
        width: "180px",
        height: "auto",
        maxHeight: "60px",
        objectFit: "contain",
    },
    iconBtn: {
        background: "transparent",
        border: "none",
        padding: "6px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
    },
    actionsWrapper: {
        display: "flex",
        gap: "8px",
        padding: "12px 16px",
    },
    newChatBtn: {
        flex: 1,
        padding: "11px 16px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "999px",
        color: "#1a1a1a",
        fontSize: "14px",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        justifyContent: "center",
        cursor: "pointer",
    },
    newGroupBtn: {
        width: "42px",
        height: "42px",
        padding: 0,
        background: "linear-gradient(135deg, #4d6bfe, #6366f1)",
        border: "none",
        borderRadius: "999px",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(77,107,254,0.35)",
        flexShrink: 0,
    },
    sectionLabel: {
        padding: "8px 20px 6px 20px",
        fontSize: "11px",
        fontWeight: "600",
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    searchWrapper: { padding: "0 16px 8px 16px" },
    searchBox: { position: "relative", display: "flex", alignItems: "center" },
    searchIcon: { position: "absolute", left: "12px", pointerEvents: "none" },
    searchInput: {
        width: "100%",
        padding: "9px 12px 9px 36px",
        background: "#f9fafb",
        border: "1px solid #f3f4f6",
        borderRadius: "10px",
        color: "#1a1a1a",
        fontSize: "13px",
    },
    list: { flex: 1, overflowY: "auto", paddingBottom: "10px" },
    stateText: {
        textAlign: "center",
        color: "#9ca3af",
        fontSize: "13px",
        padding: "30px 20px",
    },
    userItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        margin: "0 8px",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "background 0.15s, border-left 0.15s",
    },
    smallAvatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4d6bfe, #6366f1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "14px",
        flexShrink: 0,
    },
    itemInfo: { flex: 1, minWidth: 0 },
    itemName: {
        fontSize: "13.5px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    itemUsername: {
        fontSize: "12px",
        marginTop: "1px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    badge: {
        background: "#4d6bfe",
        color: "#fff",
        fontSize: "11px",
        fontWeight: "700",
        minWidth: "22px",
        height: "22px",
        padding: "0 7px",
        borderRadius: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(77,107,254,0.45)",
    },
    bottomProfile: { padding: "12px", borderTop: "1px solid #e5e7eb" },
    profileCard: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "10px",
        background: "#f9fafb",
    },
    avatar: {
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4d6bfe, #6366f1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "13px",
        flexShrink: 0,
    },
    userInfo: { flex: 1, minWidth: 0 },
    userName: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#1a1a1a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userUsername: { fontSize: "11px", color: "#9ca3af", marginTop: "1px" },
    logoutBtn: {
        background: "transparent",
        border: "none",
        color: "#9ca3af",
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        cursor: "pointer",
    },
};

export default Sidebar;