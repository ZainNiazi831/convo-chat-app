import { AlertTriangle, X } from "lucide-react";

const DeleteConfirmModal = ({
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Delete",
}) => {
    return (
        <div style={styles.overlay} onClick={onCancel}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button style={styles.closeBtn} onClick={onCancel}>
                    <X size={18} color="#6b7280" strokeWidth={2} />
                </button>

                <div style={styles.iconWrapper}>
                    <AlertTriangle size={28} color="#ef4444" strokeWidth={2} />
                </div>

                <h3 style={styles.title}>{title}</h3>
                <p style={styles.message}>{message}</p>

                <div style={styles.actions}>
                    <button style={styles.cancelBtn} onClick={onCancel}>
                        Cancel
                    </button>
                    <button style={styles.deleteBtn} onClick={onConfirm}>
                        {confirmText}
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
        position: "relative",
        background: "#fff",
        borderRadius: "16px",
        padding: "32px 24px 20px 24px",
        width: "100%",
        maxWidth: "400px",
        textAlign: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
    },
    closeBtn: {
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "transparent",
        border: "none",
        padding: "6px",
        borderRadius: "8px",
        cursor: "pointer",
    },
    iconWrapper: {
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "#fee2e2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 16px auto",
    },
    title: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: "8px",
    },
    message: {
        fontSize: "14px",
        color: "#64748b",
        lineHeight: "1.5",
        marginBottom: "24px",
    },
    actions: {
        display: "flex",
        gap: "10px",
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
    deleteBtn: {
        flex: 1,
        padding: "11px",
        background: "#ef4444",
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#fff",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
    },
};

export default DeleteConfirmModal;