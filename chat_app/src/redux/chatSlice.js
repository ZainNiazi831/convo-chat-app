import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

const initialState = {
    users: [],
    conversations: [],
    messages: [],
    selectedConversation: null,
    unreadCounts: {},
    isLoading: false,
    isSending: false,
    isError: false,
    message: "",
    showSidebarOnMobile: true,
};

// ─── FETCH USERS ───
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

// ─── SEARCH USERS ───
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

// ─── CREATE PRIVATE CONVERSATION ───
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

// ─── CREATE GROUP CONVERSATION ───
export const createGroupConversation = createAsyncThunk(
    "chat/createGroupConversation",
    async ({ name, members }, thunkAPI) => {
        try {
            const response = await API.post("/conversations", {
                isGroup: true,
                name,
                members,
            });
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to create group";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// ─── FETCH MESSAGES ───
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

// ─── SEND MESSAGE ───
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

// ─── DELETE MESSAGE FOR ME ───
export const deleteMessageForMe = createAsyncThunk(
    "chat/deleteMessageForMe",
    async (messageId, thunkAPI) => {
        try {
            await API.delete(`/messages/${messageId}/me`);
            return messageId;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to delete message";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// ─── DELETE MESSAGE FOR EVERYONE ───
export const deleteMessageForEveryone = createAsyncThunk(
    "chat/deleteMessageForEveryone",
    async (messageId, thunkAPI) => {
        try {
            const response = await API.delete(`/messages/${messageId}/everyone`);
            return response.data.data; // returns updated message
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to delete message";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// ─── FETCH UNREAD COUNTS ───
export const fetchUnreadCounts = createAsyncThunk(
    "chat/fetchUnreadCounts",
    async (_, thunkAPI) => {
        try {
            const response = await API.get("/messages/unread/counts");
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to load unread counts";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// ─── DELETE CONVERSATION ───
export const deleteConversationThunk = createAsyncThunk(
    "chat/deleteConversation",
    async (conversationId, thunkAPI) => {
        try {
            await API.delete(`/conversations/${conversationId}`);
            return conversationId;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to delete conversation";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// ─── MARK AS READ ───
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

// ─── FETCH CONVERSATIONS ───
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
        addIncomingMessage: (state, action) => {
            const incoming = action.payload;
            const senderId =
                typeof incoming.sender === "object"
                    ? incoming.sender?._id
                    : incoming.sender;
            if (!senderId) return;

            const exists = state.messages.some((m) => m._id === incoming._id);
            if (!exists) {
                state.messages.push(incoming);
            }

            const currentConvId = state.selectedConversation?._id;
            const isConversationOpen =
                currentConvId && String(currentConvId) === String(incoming.conversation);

            if (!isConversationOpen) {
                state.unreadCounts[senderId] = (state.unreadCounts[senderId] || 0) + 1;
            }
        },
        clearUnreadForUser: (state, action) => {
            const userId = action.payload;
            if (userId && state.unreadCounts[userId]) {
                delete state.unreadCounts[userId];
            }
        },
        // 🔥 Real-time delete for everyone
        markMessageDeleted: (state, action) => {
            const updatedMessage = action.payload;
            const index = state.messages.findIndex(
                (m) => m._id === updatedMessage._id
            );
            if (index !== -1) {
                state.messages[index] = {
                    ...state.messages[index],
                    ...updatedMessage,
                };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch users
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
            .addCase(createGroupConversation.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createGroupConversation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedConversation = action.payload;
                state.showSidebarOnMobile = false;
                state.conversations.unshift(action.payload);
            })
            .addCase(createGroupConversation.rejected, (state, action) => {
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
            // 🔥 Delete for me — remove from Redux messages
            .addCase(deleteMessageForMe.fulfilled, (state, action) => {
                const deletedId = action.payload;
                state.messages = state.messages.filter((m) => m._id !== deletedId);
            })
            // 🔥 Delete for everyone — update message
            .addCase(deleteMessageForEveryone.fulfilled, (state, action) => {
                const updated = action.payload;
                const index = state.messages.findIndex((m) => m._id === updated._id);
                if (index !== -1) {
                    state.messages[index] = { ...state.messages[index], ...updated };
                }
            })
            .addCase(fetchUnreadCounts.fulfilled, (state, action) => {
                state.unreadCounts = action.payload;
            })
            .addCase(deleteConversationThunk.fulfilled, (state, action) => {
                const deletedId = action.payload;
                state.conversations = state.conversations.filter(
                    (c) => c._id !== deletedId
                );
                if (state.selectedConversation?._id === deletedId) {
                    state.selectedConversation = null;
                    state.messages = [];
                    state.showSidebarOnMobile = true;
                }
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
    markMessageDeleted,
} = chatSlice.actions;

export default chatSlice.reducer;