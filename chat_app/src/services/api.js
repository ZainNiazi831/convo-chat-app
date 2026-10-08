import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
    baseURL: API_BASE_URL,
});

export const getToken = () => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
        try {
            const { token } = JSON.parse(userInfo);
            return token || null;
        } catch {
            return null;
        }
    }
    return null;
};

API.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;