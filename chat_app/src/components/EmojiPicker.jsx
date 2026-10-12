import { useEffect, useRef } from "react";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"];

const EmojiPicker = ({ x, y, onSelect, onClose, currentReaction }) => {
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
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

    const adjustedX = Math.min(x, window.innerWidth - 340);
    const adjustedY = Math.min(y, window.innerHeight - 100);

    return (
        <div
            ref={pickerRef}
            style={{
                ...styles.picker,
                top: adjustedY,
                left: adjustedX,
            }}
        >
            {QUICK_EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    style={{
                        ...styles.emojiBtn,
                        background:
                            currentReaction === emoji ? "var(--bg-active)" : "transparent",
                    }}
                    title={emoji}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

const styles = {
    picker: {
        position: "fixed",
        background: "var(--bg-modal)",
        borderRadius: "999px",
        boxShadow: "var(--shadow-lg)",
        padding: "6px 8px",
        display: "flex",
        alignItems: "center",
        gap: "2px",
        zIndex: 2100,
        border: "1px solid var(--border-color)",
    },
    emojiBtn: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        fontSize: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.15s, background 0.15s",
        padding: 0,
    },
};

export default EmojiPicker;