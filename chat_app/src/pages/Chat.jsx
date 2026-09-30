import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {
    return (
        <div style={styles.container}>
            <Sidebar />
            <ChatWindow />
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: "#f8fafc",
    },
};

export default Chat;