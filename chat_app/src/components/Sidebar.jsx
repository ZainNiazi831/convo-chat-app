import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Users } from "lucide-react";
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
import SidebarMenu from "./SidebarMenu";

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
    const [menuState, setMenuState] = useState(null);

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

    const handleGroupClick = async (group) => {
        setActiveUserId(group._id);
        dispatch(setSelectedConversation(group));
        dispatch(fetchMessages(group._id));
    };

    const handleOpenMenu = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuState({
            x: rect.right - 220,
            y: rect.bottom + 8,
        });
    };

    const formatBadge = (count) => {
        if (count > 99) return "99+";
        return count.toString();
    };

    const groups = conversations.filter((c) => c.type === "group");
    const filteredUsers = users.filter(
        (u) =>
            !searchTerm ||
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <aside style={styles.sidebar}>
                {/* Header — Logo + 3-dot menu (no buttons) */}
                <div style={styles.header}>
                    <img src="/logo.png" alt="Logo" style={styles.brandLogo} />
                    <button
                        onClick={handleOpenMenu}
                        style={styles.menuBtn}
                        title="Menu"
                    >
                        <MoreVertical size={22} color="#6b7280" strokeWidth={2} />
                    </button>
                </div>

                {/* Search Bar — Directly under header */}
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

                {/* Groups Section */}
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
                        dispatch(fetchUsers());
                    }}
                    onProfile={() => {
                        alert("Profile page coming soon!");
                    }}
                    onLogout={handleLogout}
                />
            )}

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
        padding: "16px 16px 12px 16px",
        borderBottom: "1px solid #f3f4f6",
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
        transition: "background 0.15s",
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
        background: "#f3f4f6",
        border: "1px solid transparent",
        borderRadius: "999px",
        color: "#1a1a1a",
        fontSize: "14px",
        transition: "all 0.15s",
    },
    sectionLabel: {
        padding: "8px 20px 6px 20px",
        fontSize: "11px",
        fontWeight: "600",
        color: "#9ca3af",
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
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4d6bfe, #6366f1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "15px",
        flexShrink: 0,
    },
    itemInfo: { flex: 1, minWidth: 0 },
    itemName: {
        fontSize: "14px",
        fontWeight: "500",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    itemUsername: {
        fontSize: "12.5px",
        color: "#9ca3af",
        marginTop: "2px",
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
    bottomProfile: {
        padding: "12px",
        borderTop: "1px solid #e5e7eb",
    },
    profileCard: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "10px",
        background: "#f9fafb",
    },
    avatar: {
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
    userInfo: { flex: 1, minWidth: 0 },
    userName: {
        fontSize: "13.5px",
        fontWeight: "600",
        color: "#1a1a1a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userUsername: {
        fontSize: "11.5px",
        color: "#9ca3af",
        marginTop: "1px",
    },
};

export default Sidebar;