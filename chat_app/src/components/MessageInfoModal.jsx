import { X, Check, CheckCheck, Clock, Info } from "lucide-react";

const MessageInfoModal = ({ message, onClose }) => {
    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleString([], {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <Info size={20} color="#4d6bfe" strokeWidth={2} />
                        <h2 style={styles.title}>Message Info</h2>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} color="#6b7280" strokeWidth={2} />
                    </button>
                </div>

                {/* Message Preview */}
                <div style={styles.previewBox}>
                    <div style={styles.previewLabel}>Message</div>
                    <div style={styles.previewText}>
                        {message.isDeleted ? (
                            <em style={{ color: "#9ca3af" }}>This message was deleted</em>
                        ) : (
                            message.text
                        )}
                    </div>
                </div>

                {/* Info Timeline */}
                <div style={styles.timeline}>
                    <div style={styles.timelineItem}>
                        <div style={styles.iconWrapper}>
                            <Check size={18} color="#6b7280" strokeWidth={2.5} />
                        </div>
                        <div style={styles.infoContent}>
                            <div style={styles.infoLabel}>Sent</div>
                            <div style={styles.infoDate}>
                                {formatDate(message.createdAt)}
                            </div>
                        </div>
                    </div>

                    <div style={styles.timelineLine} />

                    <div style={styles.timelineItem}>
                        <div style={styles.iconWrapper}>
                            <CheckCheck
                                size={18}
                                color={message.deliveredAt ? "#6b7280" : "#d1d5db"}
                                strokeWidth={2.5}
                            />
                        </div>
                        <div style={styles.infoContent}>
                            <div style={styles.infoLabel}>Delivered</div>
                            <div style={styles.infoDate}>
                                {message.deliveredAt
                                    ? formatDate(message.deliveredAt)
                                    : "Not delivered yet"}
                            </div>
                        </div>
                    </div>

                    <div style={styles.timelineLine} />

                    <div style={styles.timelineItem}>
                        <div style={styles.iconWrapper}>
                            <CheckCheck
                                size={18}
                                color={message.isRead ? "#53bdeb" : "#d1d5db"}
                                strokeWidth={2.5}
                            />
                        </div>
                        <div style={styles.infoContent}>
                            <div style={styles.infoLabel}>Read</div>
                            <div style={styles.infoDate}>
                                {message.isRead
                                    ? formatDate(message.readAt || message.updatedAt)
                                    : "Not read yet"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div style={styles.footer}>
                    <Clock size={14} color="#9ca3af" strokeWidth={2} />
                    <span style={styles.footerText}>
                        Message ID: {message._id?.slice(-8)}
                    </span>
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
        zIndex: 2000,
        padding: "20px",
    },
    modal: {
        background: "#fff",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "400px",
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
    previewBox: {
        padding: "16px 20px",
        background: "#f8fafc",
        borderBottom: "1px solid #e5e7eb",
    },
    previewLabel: {
        fontSize: "11px",
        fontWeight: "600",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "6px",
    },
    previewText: {
        fontSize: "14px",
        color: "#1a1a1a",
        lineHeight: "1.5",
        maxHeight: "80px",
        overflowY: "auto",
    },
    timeline: {
        padding: "20px",
        flex: 1,
        overflowY: "auto",
    },
    timelineItem: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
    },
    iconWrapper: {
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#1a1a1a",
        marginBottom: "2px",
    },
    infoDate: {
        fontSize: "12px",
        color: "#64748b",
    },
    timelineLine: {
        width: "2px",
        height: "20px",
        background: "#e5e7eb",
        marginLeft: "18px",
        marginTop: "4px",
        marginBottom: "4px",
    },
    footer: {
        padding: "12px 20px",
        background: "#f8fafc",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    footerText: {
        fontSize: "11px",
        color: "#9ca3af",
        fontFamily: "monospace",
    },
};

export default MessageInfoModal;