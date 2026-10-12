import { X, Moon, Sun, Bell, Lock, HelpCircle, LogOut } from "lucide-react";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";

const SettingsModal = ({ onClose, onLogout, onProfile }) => {
    const { theme, toggleTheme } = useTheme();
    const { user } = useSelector((state) => state.auth);

    const isDark = theme === "dark";

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Settings</h2>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} color="var(--text-secondary)" strokeWidth={2} />
                    </button>
                </div>

                <div style={styles.profileSection} onClick={onProfile}>
                    {user?.profilePicture ? (
                        <img
                            src={user.profilePicture}
                            alt="Profile"
                            style={styles.profileImg}
                        />
                    ) : (
                        <div style={styles.profilePlaceholder}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div style={styles.profileInfo}>
                        <div style={styles.profileName}>{user?.name}</div>
                        <div style={styles.profileUsername}>@{user?.username}</div>
                    </div>
                    <div style={styles.profileArrow}>→</div>
                </div>

                <div style={styles.sectionLabel}>APPEARANCE</div>
                <div style={styles.section}>
                    <div style={styles.settingItem}>
                        <div style={styles.settingLeft}>
                            {isDark ? (
                                <Moon size={20} color="var(--accent)" strokeWidth={2} />
                            ) : (
                                <Sun size={20} color="#f59e0b" strokeWidth={2} />
                            )}
                            <div style={styles.settingText}>
                                <div style={styles.settingName}>Dark Mode</div>
                                <div style={styles.settingDesc}>
                                    {isDark ? "Currently on" : "Currently off"}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            style={{
                                ...styles.toggle,
                                background: isDark ? "var(--accent)" : "var(--border-color)",
                            }}
                        >
                            <div
                                style={{
                                    ...styles.toggleKnob,
                                    transform: isDark ? "translateX(22px)" : "translateX(2px)",
                                }}
                            />
                        </button>
                    </div>
                </div>

                <div style={styles.sectionLabel}>NOTIFICATIONS</div>
                <div style={styles.section}>
                    <div style={styles.settingItem}>
                        <div style={styles.settingLeft}>
                            <Bell size={20} color="var(--text-secondary)" strokeWidth={2} />
                            <div style={styles.settingText}>
                                <div style={styles.settingName}>Notifications</div>
                                <div style={styles.settingDesc}>Sounds and popups</div>
                            </div>
                        </div>
                        <div style={styles.arrow}>→</div>
                    </div>
                </div>

                <div style={styles.sectionLabel}>PRIVACY</div>
                <div style={styles.section}>
                    <div style={styles.settingItem}>
                        <div style={styles.settingLeft}>
                            <Lock size={20} color="var(--text-secondary)" strokeWidth={2} />
                            <div style={styles.settingText}>
                                <div style={styles.settingName}>Privacy</div>
                                <div style={styles.settingDesc}>Blocked contacts</div>
                            </div>
                        </div>
                        <div style={styles.arrow}>→</div>
                    </div>
                </div>

                <div style={styles.sectionLabel}>SUPPORT</div>
                <div style={styles.section}>
                    <div style={styles.settingItem}>
                        <div style={styles.settingLeft}>
                            <HelpCircle
                                size={20}
                                color="var(--text-secondary)"
                                strokeWidth={2}
                            />
                            <div style={styles.settingText}>
                                <div style={styles.settingName}>Help & Feedback</div>
                                <div style={styles.settingDesc}>FAQs, contact us</div>
                            </div>
                        </div>
                        <div style={styles.arrow}>→</div>
                    </div>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    <button onClick={onLogout} style={styles.logoutBtn}>
                        <LogOut size={18} color="#ef4444" strokeWidth={2} />
                        <span>Logout</span>
                    </button>
                </div>

                <div style={styles.footer}>
                    <p style={styles.footerText}>Convo v1.0.0</p>
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
        zIndex: 3000,
        padding: "20px",
    },
    modal: {
        background: "var(--bg-modal)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "440px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 20px 12px 20px",
        borderBottom: "1px solid var(--border-color)",
    },
    title: {
        fontSize: "20px",
        fontWeight: "700",
        color: "var(--text-primary)",
    },
    closeBtn: {
        background: "transparent",
        border: "none",
        padding: "6px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
    },
    profileSection: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "16px 20px",
        background: "var(--bg-hover)",
        cursor: "pointer",
        borderBottom: "1px solid var(--border-color)",
    },
    profileImg: {
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
    },
    profilePlaceholder: {
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "700",
        fontSize: "22px",
        flexShrink: 0,
    },
    profileInfo: { flex: 1, minWidth: 0 },
    profileName: {
        fontSize: "16px",
        fontWeight: "700",
        color: "var(--text-primary)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    profileUsername: {
        fontSize: "13px",
        color: "var(--text-secondary)",
        marginTop: "2px",
    },
    profileArrow: {
        fontSize: "20px",
        color: "var(--text-muted)",
    },
    sectionLabel: {
        padding: "16px 20px 8px 20px",
        fontSize: "11px",
        fontWeight: "600",
        color: "var(--text-muted)",
        letterSpacing: "0.8px",
    },
    section: {
        padding: "0 12px",
    },
    settingItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 12px",
        borderRadius: "10px",
    },
    settingLeft: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flex: 1,
        minWidth: 0,
    },
    settingText: { flex: 1, minWidth: 0 },
    settingName: {
        fontSize: "14px",
        fontWeight: "600",
        color: "var(--text-primary)",
    },
    settingDesc: {
        fontSize: "12px",
        color: "var(--text-secondary)",
        marginTop: "2px",
    },
    toggle: {
        width: "46px",
        height: "26px",
        borderRadius: "13px",
        border: "none",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
    },
    toggleKnob: {
        position: "absolute",
        top: "2px",
        left: "0",
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: "#ffffff",
        transition: "transform 0.2s",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    },
    arrow: {
        fontSize: "18px",
        color: "var(--text-muted)",
        flexShrink: 0,
    },
    logoutBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        padding: "12px",
        background: "transparent",
        border: "1px solid #ef4444",
        borderRadius: "10px",
        color: "#ef4444",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    footer: {
        padding: "12px",
        textAlign: "center",
        borderTop: "1px solid var(--border-color)",
    },
    footerText: {
        fontSize: "11px",
        color: "var(--text-muted)",
    },
};

export default SettingsModal;