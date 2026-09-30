import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, reset } from "../redux/authSlice";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
    });
    const { name, username, email, password } = formData;

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
        dispatch(register({ name, username, email, password }));
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logoWrapper}>
                    <img src="/convo-logo.png" alt="NauChat" style={styles.logoImg} />
                </div>
                <h2 style={styles.heading}>Create account</h2>
                <p style={styles.subheading}>Join NauChat to start messaging</p>

                <form onSubmit={onSubmit} style={styles.form}>
                    <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={onChange}
                        placeholder="Full Name"
                        required
                        style={styles.input}
                    />
                    <input
                        type="text"
                        name="username"
                        value={username}
                        onChange={onChange}
                        placeholder="Username"
                        required
                        style={styles.input}
                    />
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
                        placeholder="Password (min 6 chars)"
                        required
                        minLength={6}
                        style={styles.input}
                    />
                    <button type="submit" style={styles.button} disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                <p style={styles.bottomText}>
                    Already have an account?{" "}
                    <Link to="/login" style={styles.link}>
                        Sign in
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
        background:
            "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #fce7f3 100%)",
        padding: "20px",
    },
    card: {
        background: "#ffffff",
        padding: "48px 40px",
        borderRadius: "24px",
        boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 40px -8px rgba(77,107,254,0.15)",
        width: "100%",
        maxWidth: "420px",
        border: "1px solid #e2e8f0",
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
        color: "#0f172a",
        letterSpacing: "-0.5px",
    },
    subheading: {
        textAlign: "center",
        color: "#64748b",
        marginBottom: "32px",
        fontSize: "14px",
    },
    form: { display: "flex", flexDirection: "column", gap: "14px" },
    input: {
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        fontSize: "15px",
        outline: "none",
        background: "#f8fafc",
        color: "#0f172a",
        transition: "all 0.2s",
    },
    button: {
        padding: "14px",
        background: "linear-gradient(135deg, #4d6bfe, #6366f1)",
        color: "#fff",
        border: "none",
        borderRadius: "12px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "8px",
        boxShadow: "0 4px 12px rgba(77,107,254,0.35)",
    },
    bottomText: {
        textAlign: "center",
        marginTop: "24px",
        color: "#64748b",
        fontSize: "14px",
    },
    link: { color: "#4d6bfe", fontWeight: "600", textDecoration: "none" },
};

export default Register;