import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

// Get token from localStorage
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

// Attach token to every request
API.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;