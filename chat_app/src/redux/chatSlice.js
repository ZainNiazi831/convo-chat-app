import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

const initialState = {
    users: [],
    conversations: [],
    messages: [],
    selectedConversation: null,
    isLoading: false,
    isSending: false,
    isError: false,
    message: "",
};

// Fetch all users
export const fetchUsers = createAsyncThunk(
    "chat/fetchUsers",
    async (_, thunkAPI) => {
        try {
            const response = await API.get("/users");
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to load users";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Search users
export const searchUsers = createAsyncThunk(
    "chat/searchUsers",
    async (query, thunkAPI) => {
        try {
            const response = await API.get(`/users/search?q=${query}`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Search failed";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create or get private conversation
export const createConversation = createAsyncThunk(
    "chat/createConversation",
    async (userId, thunkAPI) => {
        try {
            const response = await API.post("/conversations", { userId });
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to start conversation";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Fetch messages of a conversation
export const fetchMessages = createAsyncThunk(
    "chat/fetchMessages",
    async (conversationId, thunkAPI) => {
        try {
            const response = await API.get(`/messages/${conversationId}`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to load messages";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Send a message (REST API — socket ko ChatWindow emit karega)
export const sendMessage = createAsyncThunk(
    "chat/sendMessage",
    async ({ conversationId, text }, thunkAPI) => {
        try {
            const response = await API.post("/messages", { conversationId, text });
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to send message";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setSelectedConversation: (state, action) => {
            state.selectedConversation = action.payload;
        },
        clearSelectedConversation: (state) => {
            state.selectedConversation = null;
            state.messages = [];
        },
        resetChat: (state) => {
            state.users = [];
            state.conversations = [];
            state.messages = [];
            state.selectedConversation = null;
            state.isLoading = false;
            state.isSending = false;
            state.isError = false;
            state.message = "";
        },
        // 🔥 Socket se aaya message Redux mein add karne ke liye
        addIncomingMessage: (state, action) => {
            const incoming = action.payload;
            // Check if message already exists (avoid duplicates)
            const exists = state.messages.some((m) => m._id === incoming._id);
            if (!exists) {
                state.messages.push(incoming);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(searchUsers.fulfilled, (state, action) => {
                state.users = action.payload;
            })
            .addCase(createConversation.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createConversation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedConversation = action.payload;
            })
            .addCase(createConversation.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.messages = action.payload;
            })
            .addCase(sendMessage.pending, (state) => {
                state.isSending = true;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.isSending = false;
                const exists = state.messages.some((m) => m._id === action.payload._id);
                if (!exists) {
                    state.messages.push(action.payload);
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.isSending = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const {
    setSelectedConversation,
    clearSelectedConversation,
    resetChat,
    addIncomingMessage,
} = chatSlice.actions;
export default chatSlice.reducer;