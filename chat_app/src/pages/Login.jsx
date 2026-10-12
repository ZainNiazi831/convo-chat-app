import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, reset } from "../redux/authSlice";

const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isLoading, isError, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) alert(message);
        if (user) navigate("/chat");
        dispatch(reset());
    }, [user, isError, message, navigate, dispatch]);

    const onChange = (e) =>
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const onSubmit = (e) => {
        e.preventDefault();
        localStorage.clear();
        dispatch(login({ email, password }));
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logoWrapper}>
                    <img src="/convo-logo.png" alt="Convo" style={styles.logoImg} />
                </div>
                <h2 style={styles.heading}>Welcome back</h2>
                <p style={styles.subheading}>Sign in to continue to your chats</p>

                <form onSubmit={onSubmit} style={styles.form}>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        placeholder="Email"
                        required
                        style={styles.input}
                    />
                    <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        placeholder="Password"
                        required
                        style={styles.input}
                    />
                    <button type="submit" style={styles.button} disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p style={styles.bottomText}>
                    Don't have an account?{" "}
                    <Link to="/register" style={styles.link}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-secondary)",
        padding: "20px",
        transition: "background 0.3s ease",
    },
    card: {
        background: "var(--bg-modal)",
        padding: "48px 40px",
        borderRadius: "24px",
        boxShadow: "var(--shadow-lg)",
        width: "100%",
        maxWidth: "420px",
        border: "1px solid var(--border-color)",
    },
    logoWrapper: {
        display: "flex",
        justifyContent: "center",
        marginBottom: "20px",
    },
    logoImg: { height: "70px", width: "auto", objectFit: "contain" },
    heading: {
        textAlign: "center",
        fontSize: "26px",
        fontWeight: "700",
        marginBottom: "8px",
        color: "var(--text-primary)",
        letterSpacing: "-0.5px",
    },
    subheading: {
        textAlign: "center",
        color: "var(--text-secondary)",
        marginBottom: "32px",
        fontSize: "14px",
    },
    form: { display: "flex", flexDirection: "column", gap: "14px" },
    input: {
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid var(--border-color)",
        fontSize: "15px",
        outline: "none",
        background: "var(--bg-input)",
        color: "var(--text-primary)",
        transition: "all 0.2s",
        fontFamily: "inherit",
    },
    button: {
        padding: "14px",
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
        color: "#fff",
        border: "none",
        borderRadius: "12px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "8px",
        boxShadow: "var(--shadow-sm)",
        fontFamily: "inherit",
    },
    bottomText: {
        textAlign: "center",
        marginTop: "24px",
        color: "var(--text-secondary)",
        fontSize: "14px",
    },
    link: {
        color: "var(--accent)",
        fontWeight: "600",
        textDecoration: "none",
    },
};

export default Login;