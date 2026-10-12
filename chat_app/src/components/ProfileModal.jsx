import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { X, Camera, User, Save } from "lucide-react";
import { updateProfile } from "../redux/authSlice";

const ProfileModal = ({ onClose }) => {
    const dispatch = useDispatch();
    const { user, isLoading } = useSelector((state) => state.auth);

    const [name, setName] = useState(user?.name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [profilePicture, setProfilePicture] = useState(
        user?.profilePicture || ""
    );
    const [previewImage, setPreviewImage] = useState(
        user?.profilePicture || ""
    );
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500000) {
            alert("Please choose an image smaller than 500KB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
            setProfilePicture(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            alert("Name cannot be empty");
            return;
        }

        const result = await dispatch(
            updateProfile({
                name: name.trim(),
                bio: bio.trim(),
                profilePicture,
            })
        );

        if (result.meta.requestStatus === "fulfilled") {
            alert("Profile updated successfully!");
            onClose();
        } else {
            alert(result.payload || "Failed to update profile");
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <User size={20} color="var(--accent)" strokeWidth={2} />
                        <h2 style={styles.title}>Profile</h2>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} color="var(--text-secondary)" strokeWidth={2} />
                    </button>
                </div>

                <div style={styles.avatarSection}>
                    <div style={styles.avatarWrapper}>
                        {previewImage ? (
                            <img src={previewImage} alt="Profile" style={styles.avatarImg} />
                        ) : (
                            <div style={styles.avatarPlaceholder}>
                                {name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={styles.cameraBtn}
                            title="Change picture"
                        >
                            <Camera size={16} color="#fff" strokeWidth={2.5} />
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                    />
                    <p style={styles.avatarHint}>Click camera icon to change photo</p>
                </div>

                <div style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            style={styles.input}
                            maxLength={50}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            value={user?.username || ""}
                            disabled
                            style={{
                                ...styles.input,
                                background: "var(--bg-tertiary)",
                                color: "var(--text-muted)",
                            }}
                        />
                        <p style={styles.hint}>Username cannot be changed</p>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="text"
                            value={user?.email || ""}
                            disabled
                            style={{
                                ...styles.input,
                                background: "var(--bg-tertiary)",
                                color: "var(--text-muted)",
                            }}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            style={styles.textarea}
                            maxLength={200}
                            rows={3}
                        />
                        <p style={styles.hint}>{bio.length}/200 characters</p>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.cancelBtn}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        style={{
                            ...styles.saveBtn,
                            opacity: isLoading ? 0.6 : 1,
                            cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                    >
                        <Save size={16} color="#fff" strokeWidth={2} />
                        {isLoading ? "Saving..." : "Save Changes"}
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
        zIndex: 3000,
        padding: "20px",
    },
    modal: {
        background: "var(--bg-modal)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "460px",
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
        padding: "18px 20px",
        borderBottom: "1px solid var(--border-color)",
    },
    headerLeft: { display: "flex", alignItems: "center", gap: "10px" },
    title: { fontSize: "17px", fontWeight: "700", color: "var(--text-primary)" },
    closeBtn: {
        background: "transparent",
        border: "none",
        padding: "6px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
    },
    avatarSection: {
        padding: "24px 20px 12px 20px",
        textAlign: "center",
    },
    avatarWrapper: {
        position: "relative",
        width: "100px",
        height: "100px",
        margin: "0 auto 12px auto",
    },
    avatarImg: {
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid var(--border-color)",
    },
    avatarPlaceholder: {
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "700",
        fontSize: "36px",
        border: "3px solid var(--border-color)",
    },
    cameraBtn: {
        position: "absolute",
        bottom: "0",
        right: "0",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "var(--accent)",
        border: "3px solid var(--bg-modal)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "var(--shadow-sm)",
    },
    avatarHint: {
        fontSize: "12px",
        color: "var(--text-muted)",
    },
    form: {
        padding: "12px 20px",
        overflowY: "auto",
        flex: 1,
    },
    field: { marginBottom: "16px" },
    label: {
        display: "block",
        fontSize: "12px",
        fontWeight: "600",
        color: "var(--text-secondary)",
        marginBottom: "6px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    input: {
        width: "100%",
        padding: "11px 14px",
        background: "var(--bg-input)",
        border: "1px solid var(--border-color)",
        borderRadius: "10px",
        fontSize: "14px",
        color: "var(--text-primary)",
        outline: "none",
        fontFamily: "inherit",
    },
    textarea: {
        width: "100%",
        padding: "11px 14px",
        background: "var(--bg-input)",
        border: "1px solid var(--border-color)",
        borderRadius: "10px",
        fontSize: "14px",
        color: "var(--text-primary)",
        outline: "none",
        resize: "none",
        fontFamily: "inherit",
    },
    hint: {
        fontSize: "11px",
        color: "var(--text-muted)",
        marginTop: "4px",
    },
    footer: {
        display: "flex",
        gap: "10px",
        padding: "16px 20px",
        borderTop: "1px solid var(--border-color)",
    },
    cancelBtn: {
        flex: 1,
        padding: "12px",
        background: "transparent",
        border: "1px solid var(--border-color)",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "500",
        color: "var(--text-secondary)",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    saveBtn: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px",
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#fff",
        boxShadow: "var(--shadow-sm)",
        fontFamily: "inherit",
    },
};

export default ProfileModal;