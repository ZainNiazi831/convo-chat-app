import { X, Users, Crown, UserMinus } from "lucide-react";
import { useSelector } from "react-redux";

const GroupInfoModal = ({ group, onClose, onRemoveMember }) => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin =
        String(group.groupAdmin?._id || group.groupAdmin) === String(user._id);

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <Users size={20} color="#8b5cf6" strokeWidth={2} />
                        <h2 style={styles.title}>Group Info</h2>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} color="#6b7280" strokeWidth={2} />
                    </button>
                </div>

                {/* Group Avatar + Name */}
                <div style={styles.groupHeader}>
                    <div style={styles.groupAvatar}>
                        <Users size={32} color="#fff" strokeWidth={2} />
                    </div>
                    <h3 style={styles.groupName}>{group.name}</h3>
                    <p style={styles.groupMeta}>
                        {group.members?.length || 0} members
                    </p>
                </div>

                {/* Members list */}
                <div style={styles.membersSection}>
                    <div style={styles.sectionLabel}>
                        MEMBERS ({group.members?.length || 0})
                    </div>
                    <div style={styles.membersList}>
                        {group.members?.map((m) => {
                            const isMemberAdmin =
                                String(m._id) ===
                                String(group.groupAdmin?._id || group.groupAdmin);
                            const isMe = String(m._id) === String(user._id);
                            return (
                                <div key={m._id} style={styles.memberItem}>
                                    <div style={styles.avatar}>
                                        {m.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={styles.memberInfo}>
                                        <div style={styles.memberName}>
                                            {m.name}{" "}
                                            {isMe && <span style={styles.you}>(You)</span>}
                                        </div>
                                        <div style={styles.memberUsername}>@{m.username}</div>
                                    </div>
                                    {isMemberAdmin && (
                                        <div style={styles.adminBadge}>
                                            <Crown size={12} color="#f59e0b" strokeWidth={2.5} />
                                            <span>Admin</span>
                                        </div>
                                    )}
                                    {isAdmin && !isMemberAdmin && !isMe && (
                                        <button
                                            onClick={() => onRemoveMember(m._id)}
                                            style={styles.removeBtn}
                                            title="Remove member"
                                        >
                                            <UserMinus size={16} color="#ef4444" strokeWidth={2} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
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
        maxWidth: "440px",
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
    headerLeft: { display: "flex", alignItems: "center", gap: "10px" },
    title: { fontSize: "17px", fontWeight: "700", color: "#1a1a1a" },
    closeBtn: {
        background: "transparent",
        border: "none",
        padding: "6px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
    },
    groupHeader: {
        padding: "24px 20px",
        textAlign: "center",
        borderBottom: "1px solid #f3f4f6",
    },
    groupAvatar: {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 12px auto",
    },
    groupName: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: "4px",
    },
    groupMeta: { fontSize: "13px", color: "#9ca3af" },
    membersSection: {
        flex: 1,
        overflowY: "auto",
        padding: "12px 0",
    },
    sectionLabel: {
        padding: "8px 20px",
        fontSize: "11px",
        fontWeight: "600",
        color: "#9ca3af",
        letterSpacing: "0.5px",
    },
    membersList: { padding: "0 8px" },
    memberItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "10px",
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
    memberInfo: { flex: 1, minWidth: 0 },
    memberName: {
        fontSize: "14px",
        fontWeight: "500",
        color: "#1a1a1a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    you: { color: "#9ca3af", fontWeight: "400", fontSize: "12px" },
    memberUsername: { fontSize: "12px", color: "#9ca3af", marginTop: "1px" },
    adminBadge: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "#fef3c7",
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: "600",
        color: "#b45309",
        flexShrink: 0,
    },
    removeBtn: {
        background: "transparent",
        border: "1px solid #fee2e2",
        padding: "6px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
};

export default GroupInfoModal;