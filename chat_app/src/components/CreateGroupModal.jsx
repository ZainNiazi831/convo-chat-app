import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { X, Search, Check, Users } from "lucide-react";
import { createGroupConversation } from "../redux/chatSlice";

const CreateGroupModal = ({ onClose }) => {
    const dispatch = useDispatch();
    const { users } = useSelector((state) => state.chat);
    const [groupName, setGroupName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleMember = (userId) => {
        setSelectedMembers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedMembers.length < 2) return;

        setIsCreating(true);
        const result = await dispatch(
            createGroupConversation({
                name: groupName.trim(),
                members: selectedMembers,
            })
        );

        if (result.meta.requestStatus === "fulfilled") {
            onClose();
        } else {
            setIsCreating(false);
            alert(result.payload || "Failed to create group");
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <Users size={20} color="#4d6bfe" strokeWidth={2} />
                        <h2 style={styles.title}>New Group</h2>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} color="#6b7280" strokeWidth={2} />
                    </button>
                </div>

                {/* Group Name Input */}
                <div style={styles.fieldWrapper}>
                    <label style={styles.label}>Group Name</label>
                    <input
                        type="text"
                        placeholder="Enter group name..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        style={styles.input}
                        autoFocus
                    />
                </div>

                {/* Search */}
                <div style={styles.fieldWrapper}>
                    <label style={styles.label}>
                        Select Members ({selectedMembers.length} selected)
                    </label>
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

                {/* Users List */}
                <div style={styles.usersList}>
                    {filteredUsers.length === 0 && (
                        <div style={styles.emptyText}>No users found</div>
                    )}

                    {filteredUsers.map((u) => {
                        const isSelected = selectedMembers.includes(u._id);
                        return (
                            <div
                                key={u._id}
                                style={{
                                    ...styles.userItem,
                                    background: isSelected ? "#eef2ff" : "transparent",
                                }}
                                onClick={() => toggleMember(u._id)}
                            >
                                <div style={styles.avatar}>
                                    {u.name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={styles.userInfo}>
                                    <div style={styles.userName}>{u.name}</div>
                                    <div style={styles.userUsername}>@{u.username}</div>
                                </div>
                                <div
                                    style={{
                                        ...styles.checkbox,
                                        background: isSelected ? "#4d6bfe" : "#fff",
                                        borderColor: isSelected ? "#4d6bfe" : "#cbd5e1",
                                    }}
                                >
                                    {isSelected && (
                                        <Check size={14} color="#fff" strokeWidth={3} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.cancelBtn}>
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        style={{
                            ...styles.createBtn,
                            opacity:
                                !groupName.trim() || selectedMembers.length < 2 || isCreating
                                    ? 0.5
                                    : 1,
                            cursor:
                                !groupName.trim() || selectedMembers.length < 2 || isCreating
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                        disabled={
                            !groupName.trim() || selectedMembers.length < 2 || isCreating
                        }
                    >
                        {isCreating ? "Creating..." : "Create Group"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
    },
    modal: {
        background: "#fff",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "480px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 20px",
        borderBottom: "1px solid #e5e7eb",
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    title: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#1a1a1a",
    },
    closeBtn: {
        background: "transparent",
        border: "none",
        padding: "6px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    fieldWrapper: {
        padding: "16px 20px 0 20px",
    },
    label: {
        display: "block",
        fontSize: "12px",
        fontWeight: "600",
        color: "#64748b",
        marginBottom: "8px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    input: {
        width: "100%",
        padding: "11px 14px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        color: "#1a1a1a",
        outline: "none",
    },
    searchBox: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    searchIcon: {
        position: "absolute",
        left: "12px",
        pointerEvents: "none",
    },
    searchInput: {
        width: "100%",
        padding: "11px 14px 11px 38px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        color: "#1a1a1a",
        outline: "none",
    },
    usersList: {
        flex: 1,
        overflowY: "auto",
        padding: "8px 12px",
        minHeight: "180px",
        maxHeight: "320px",
    },
    emptyText: {
        textAlign: "center",
        color: "#9ca3af",
        fontSize: "13px",
        padding: "30px 20px",
    },
    userItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "10px",
        cursor: "pointer",
        marginBottom: "2px",
        transition: "background 0.15s",
    },
    avatar: {
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
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    userName: {
        fontSize: "14px",
        fontWeight: "500",
        color: "#1a1a1a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userUsername: {
        fontSize: "12px",
        color: "#9ca3af",
        marginTop: "1px",
    },
    checkbox: {
        width: "22px",
        height: "22px",
        borderRadius: "6px",
        border: "2px solid #cbd5e1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.15s",
    },
    footer: {
        display: "flex",
        gap: "10px",
        padding: "16px 20px",
        borderTop: "1px solid #e5e7eb",
    },
    cancelBtn: {
        flex: 1,
        padding: "11px",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "500",
        color: "#64748b",
        cursor: "pointer",
    },
    createBtn: {
        flex: 1,
        padding: "11px",
        background: "linear-gradient(135deg, #4d6bfe, #6366f1)",
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#fff",
        boxShadow: "0 2px 8px rgba(77,107,254,0.35)",
        transition: "opacity 0.15s",
    },
};

export default CreateGroupModal;