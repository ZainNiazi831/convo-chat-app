import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

const initialState = {
    users: [],
    conversations: [],
    messages: [],
    selectedConversation: null,
    unreadCounts: {}, // { senderId: count }
    isLoading: false,
    isSending: false,
    isError: false,
    message: "",
    showSidebarOnMobile: true,
};

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

export const markConversationRead = createAsyncThunk(
    "chat/markConversationRead",
    async ({ conversationId, otherUserId }, thunkAPI) => {
        try {
            await API.put(`/messages/${conversationId}/read`);
            return otherUserId;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to mark as read";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const fetchConversations = createAsyncThunk(
    "chat/fetchConversations",
    async (_, thunkAPI) => {
        try {
            const response = await API.get("/conversations");
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to load conversations";
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
            state.showSidebarOnMobile = false;
        },
        clearSelectedConversation: (state) => {
            state.selectedConversation = null;
            state.messages = [];
            state.showSidebarOnMobile = true;
        },
        showMobileSidebar: (state) => {
            state.showSidebarOnMobile = true;
        },
        resetChat: (state) => {
            state.users = [];
            state.conversations = [];
            state.messages = [];
            state.selectedConversation = null;
            state.unreadCounts = {};
            state.isLoading = false;
            state.isSending = false;
            state.isError = false;
            state.message = "";
            state.showSidebarOnMobile = true;
        },
        // 🔥 WhatsApp-style unread count
        addIncomingMessage: (state, action) => {
            const incoming = action.payload;

            const senderId =
                typeof incoming.sender === "object"
                    ? incoming.sender?._id
                    : incoming.sender;

            if (!senderId) {
                console.log("❌ No sender ID in incoming message");
                return;
            }

            // Add message (dedupe)
            const exists = state.messages.some((m) => m._id === incoming._id);
            if (!exists) {
                state.messages.push(incoming);
            }

            // Check if conversation is currently open
            const currentConvId = state.selectedConversation?._id;
            const isConversationOpen =
                currentConvId && String(currentConvId) === String(incoming.conversation);

            console.log("🔍 addIncomingMessage:", {
                senderId,
                incomingConv: incoming.conversation,
                currentConv: currentConvId,
                isOpen: isConversationOpen,
            });

            // Increment unread ONLY if conversation is NOT open
            if (!isConversationOpen) {
                state.unreadCounts[senderId] = (state.unreadCounts[senderId] || 0) + 1;
                console.log("📊 New unreadCounts:", { ...state.unreadCounts });
            }
        },
        clearUnreadForUser: (state, action) => {
            const userId = action.payload;
            if (userId && state.unreadCounts[userId]) {
                delete state.unreadCounts[userId];
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
                state.showSidebarOnMobile = false;
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
            })
            .addCase(markConversationRead.fulfilled, (state, action) => {
                const otherUserId = action.payload;
                if (otherUserId) {
                    delete state.unreadCounts[otherUserId];
                }
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.conversations = action.payload;
            });
    },
});

export const {
    setSelectedConversation,
    clearSelectedConversation,
    resetChat,
    addIncomingMessage,
    showMobileSidebar,
    clearUnreadForUser,
} = chatSlice.actions;
export default chatSlice.reducer;