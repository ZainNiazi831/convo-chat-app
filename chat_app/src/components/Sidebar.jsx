import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/authSlice";
import {
    fetchUsers,
    searchUsers,
    createConversation,
    fetchMessages,
    resetChat,
} from "../redux/chatSlice";

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { users, isLoading } = useSelector((state) => state.chat);
    const [searchTerm, setSearchTerm] = useState("");
    const [hoveredId, setHoveredId] = useState(null);
    const [activeUserId, setActiveUserId] = useState(null);

    useEffect(() => {
        dispatch(fetchUsers());
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
            dispatch(fetchMessages(result.payload._id));
        }
    };

    return (
        <aside style={styles.sidebar}>
            {/* Header — logo LEFT, search RIGHT */}
            <div style={styles.header}>
                <img src="/logo.png" alt="Logo" style={styles.brandLogo} />
                <button style={styles.iconBtn} title="Search">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </button>
            </div>

            {/* New Chat */}
            <div style={styles.newChatWrapper}>
                <button style={styles.newChatBtn}>
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
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    New chat
                </button>
            </div>

            <div style={styles.sectionLabel}>Contacts</div>

            {/* Search */}
            <div style={styles.searchWrapper}>
                <div style={styles.searchBox}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={styles.searchIcon}
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
            </div>

            {/* Users List */}
            <div style={styles.list}>
                {isLoading && !users.length && (
                    <div style={styles.stateText}>Loading...</div>
                )}

                {!isLoading && users.length === 0 && (
                    <div style={styles.stateText}>
                        {searchTerm ? "No users found" : "No users yet"}
                    </div>
                )}

                {users.map((u) => {
                    const isActive = activeUserId === u._id;
                    const isHovered = hoveredId === u._id;
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
                                    }}
                                >
                                    {u.name}
                                </div>
                                <div style={styles.itemUsername}>@{u.username}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Profile */}
            <div style={styles.bottomProfile}>
                <div style={styles.profileCard}>
                    <div style={styles.avatar}>
                        {user?.name?.charAt(0).toUpperCase()}
                        <span style={styles.onlineDot} />
                    </div>
                    <div style={styles.userInfo}>
                        <div style={styles.userName}>{user?.name}</div>
                        <div style={styles.userUsername}>@{user?.username}</div>
                    </div>
                    <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
};

const styles = {
    sidebar: {
        width: "300px",
        height: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #e5e7eb",
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
        marginLeft: "0px",
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
        marginRight: "0px",
    },
    newChatWrapper: { padding: "12px 16px 12px 16px" },
    newChatBtn: {
        width: "100%",
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
        fontWeight: "500",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    itemUsername: {
        fontSize: "12px",
        color: "#9ca3af",
        marginTop: "1px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
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
        position: "relative",
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
    onlineDot: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: "#22c55e",
        border: "2px solid #f9fafb",
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