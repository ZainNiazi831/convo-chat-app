import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

const initialState = {
    user: userInfo,
    isLoading: false,
    isError: false,
    message: "",
};

// Register
export const register = createAsyncThunk(
    "auth/register",
    async (userData, thunkAPI) => {
        try {
            const response = await API.post("/auth/register", userData);
            localStorage.setItem("userInfo", JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Register failed";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Login
export const login = createAsyncThunk(
    "auth/login",
    async (userData, thunkAPI) => {
        try {
            const response = await API.post("/auth/login", userData);
            localStorage.setItem("userInfo", JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Login failed";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Logout
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
    try {
        await API.post("/auth/logout");
    } catch (error) {
        // ignore
    }
    localStorage.removeItem("userInfo");
    return null;
});

// 🔥 Update Profile
export const updateProfile = createAsyncThunk(
    "auth/updateProfile",
    async (userData, thunkAPI) => {
        try {
            const response = await API.put("/users/profile", userData);
            // Update localStorage with new user data (preserve token)
            const currentUser = JSON.parse(localStorage.getItem("userInfo"));
            const updatedUser = {
                ...currentUser,
                ...response.data,
            };
            localStorage.setItem("userInfo", JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to update profile";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.message = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
            })
            .addCase(login.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;