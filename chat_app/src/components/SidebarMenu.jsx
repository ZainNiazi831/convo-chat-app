import { useEffect, useRef } from "react";
import {
    Users,
    MessageSquarePlus,
    Settings,
    LogOut,
    User,
} from "lucide-react";

const SidebarMenu = ({
    x,
    y,
    onClose,
    onNewGroup,
    onNewChat,
    onProfile,
    onLogout,
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
            <button
                onClick={() => {
                    onNewGroup();
                    onClose();
                }}
                style={styles.menuItem}
            >
                <Users size={18} color="#4d6bfe" strokeWidth={2} />
                <span>New group</span>
            </button>

            <button
                onClick={() => {
                    onNewChat();
                    onClose();
                }}
                style={styles.menuItem}
            >
                <MessageSquarePlus size={18} color="#4d6bfe" strokeWidth={2} />
                <span>New chat</span>
            </button>

            <div style={styles.divider} />

            <button
                onClick={() => {
                    onProfile();
                    onClose();
                }}
                style={styles.menuItem}
            >
                <User size={18} color="#6b7280" strokeWidth={2} />
                <span>Profile</span>
            </button>

            <button
                onClick={() => {
                    onClose();
                }}
                style={styles.menuItem}
            >
                <Settings size={18} color="#6b7280" strokeWidth={2} />
                <span>Settings</span>
            </button>

            <div style={styles.divider} />

            <button
                onClick={() => {
                    onLogout();
                    onClose();
                }}
                style={{ ...styles.menuItem, color: "#ef4444" }}
            >
                <LogOut size={18} color="#ef4444" strokeWidth={2} />
                <span style={{ color: "#ef4444" }}>Logout</span>
            </button>
        </div>
    );
};

const styles = {
    menu: {
        position: "fixed",
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
        padding: "6px",
        zIndex: 2200,
        minWidth: "220px",
        border: "1px solid #e5e7eb",
    },
    menuItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "11px 14px",
        background: "transparent",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        color: "#1a1a1a",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "background 0.15s",
    },
    divider: {
        height: "1px",
        background: "#e5e7eb",
        margin: "4px 0",
    },
};

export default SidebarMenu;