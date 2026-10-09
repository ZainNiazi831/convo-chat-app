import { useEffect, useRef } from "react";
import { Trash2, UserX } from "lucide-react";

const MessageMenu = ({ x, y, isOwn, onDeleteForMe, onDeleteForEveryone, onClose }) => {
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
    const adjustedX = Math.min(x, window.innerWidth - 220);
    const adjustedY = Math.min(y, window.innerHeight - 140);

    return (
        <div
            ref={menuRef}
            style={{
                ...styles.menu,
                top: adjustedY,
                left: adjustedX,
            }}
        >
            <button onClick={onDeleteForMe} style={styles.menuItem}>
                <UserX size={16} color="#ef4444" strokeWidth={2} />
                <span>Delete for me</span>
            </button>

            {isOwn && (
                <button onClick={onDeleteForEveryone} style={styles.menuItem}>
                    <Trash2 size={16} color="#ef4444" strokeWidth={2} />
                    <span>Delete for everyone</span>
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
        minWidth: "200px",
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
};

export default MessageMenu;