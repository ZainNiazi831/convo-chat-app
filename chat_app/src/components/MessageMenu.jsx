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

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Adjust position so menu stays on screen
    const adjustedX = Math.min(x, window.innerWidth - 240);
    const adjustedY = Math.min(y, window.innerHeight - 280);

    return (
        <div
            ref={menuRef}
            style={{
                ...styles.menu,
                top: adjustedY,
                left: adjustedX,
            }}
        >
            {/* Copy */}
            <button onClick={onCopy} style={styles.menuItem}>
                <Copy size={16} color="#6b7280" strokeWidth={2} />
                <span>Copy</span>
            </button>

            {/* Reply */}
            <button onClick={onReply} style={styles.menuItem}>
                <Reply size={16} color="#6b7280" strokeWidth={2} />
                <span>Reply</span>
            </button>

            {/* Message Info */}
            <button onClick={onInfo} style={styles.menuItem}>
                <Info size={16} color="#6b7280" strokeWidth={2} />
                <span>Message info</span>
            </button>

            <div style={styles.divider} />

            {/* Delete for me */}
            <button onClick={onDeleteForMe} style={styles.menuItem}>
                <UserX size={16} color="#ef4444" strokeWidth={2} />
                <span style={{ color: "#ef4444" }}>Delete for me</span>
            </button>

            {/* Delete for everyone (only own messages) */}
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
        background: "#ffffff",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        padding: "6px",
        zIndex: 2000,
        minWidth: "220px",
        border: "1px solid #e5e7eb",
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
        color: "#1a1a1a",
        fontFamily: "inherit",
        textAlign: "left",
    },
    divider: {
        height: "1px",
        background: "#e5e7eb",
        margin: "4px 0",
    },
};

export default MessageMenu;