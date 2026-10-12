import { useEffect, useRef } from "react";
import { Copy, Reply, Info, Trash2, UserX } from "lucide-react";

const MessageMenu = ({
    x,
    y,
    isOwn,
    message,
    onCopy,
    onReply,
    onInfo,
    onDeleteForMe,
    onDeleteForEveryone,
    onClose,
}) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, [onClose]);

    const adjustedX = Math.min(x, window.innerWidth - 240);
    const adjustedY = Math.min(y, window.innerHeight - 300);

    return (
        <div
            ref={menuRef}
            style={{
                ...styles.menu,
                top: adjustedY,
                left: adjustedX,
            }}
        >
            <button onClick={onCopy} style={styles.menuItem}>
                <Copy size={16} color="var(--text-secondary)" strokeWidth={2} />
                <span>Copy</span>
            </button>

            <button onClick={onReply} style={styles.menuItem}>
                <Reply size={16} color="var(--text-secondary)" strokeWidth={2} />
                <span>Reply</span>
            </button>

            <button onClick={onInfo} style={styles.menuItem}>
                <Info size={16} color="var(--text-secondary)" strokeWidth={2} />
                <span>Message info</span>
            </button>

            <div style={styles.divider} />

            <button onClick={onDeleteForMe} style={styles.menuItem}>
                <UserX size={16} color="#ef4444" strokeWidth={2} />
                <span style={{ color: "#ef4444" }}>Delete for me</span>
            </button>

            {isOwn && (
                <button onClick={onDeleteForEveryone} style={styles.menuItem}>
                    <Trash2 size={16} color="#ef4444" strokeWidth={2} />
                    <span style={{ color: "#ef4444" }}>Delete for everyone</span>
                </button>
            )}
        </div>
    );
};

const styles = {
    menu: {
        position: "fixed",
        background: "var(--bg-modal)",
        borderRadius: "10px",
        boxShadow: "var(--shadow-lg)",
        padding: "6px",
        zIndex: 2000,
        minWidth: "220px",
        border: "1px solid var(--border-color)",
    },
    menuItem: {
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
        color: "var(--text-primary)",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "background 0.15s",
    },
    divider: {
        height: "1px",
        background: "var(--border-color)",
        margin: "4px 0",
    },
};

export default MessageMenu;