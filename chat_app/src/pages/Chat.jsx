import { useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import useIsMobile from "../hooks/useIsMobile";

const Chat = () => {
    const isMobile = useIsMobile();
    const { showSidebarOnMobile } = useSelector((state) => state.chat);

    const showSidebar = !isMobile || showSidebarOnMobile;
    const showChat = !isMobile || !showSidebarOnMobile;

    return (
        <div style={styles.container}>
            {showSidebar && (
                <div style={isMobile ? styles.mobilePanel : styles.desktopSidebar}>
                    <Sidebar />
                </div>
            )}
            {showChat && (
                <div style={isMobile ? styles.mobilePanel : styles.desktopChat}>
                    <ChatWindow />
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "#f8fafc",
    },
    desktopSidebar: {
        width: "340px",
        height: "100vh",
        flexShrink: 0,
        borderRight: "1px solid #e5e7eb",
    },
    desktopChat: {
        flex: 1,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
    },
    mobilePanel: {
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
};

export default Chat;