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

// ─── SEND MESSAGE (with reply support) ───
export const sendMessage = createAsyncThunk(
    "chat/sendMessage",
    async ({ conversationId, text, replyTo }, thunkAPI) => {
        try {
            const response = await API.post("/messages", {
                conversationId,
                text,
                replyTo: replyTo || null,
            });
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
            return response.data.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to delete message";
            return thunkAPI.rejectWithValue(message);
        }
    }
);
// ─── TOGGLE REACTION ───
export const toggleReaction = createAsyncThunk(
    "chat/toggleReaction",
    async ({ messageId, emoji }, thunkAPI) => {
        try {
            const response = await API.put(`/messages/${messageId}/react`, {
                emoji,
            });
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to toggle reaction";
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
// ─── TOGGLE FAVOURITE (Optimistic) ───
export const toggleFavouriteThunk = createAsyncThunk(
    "chat/toggleFavourite",
    async ({ conversationId, userId }, thunkAPI) => {
        try {
            const response = await API.put(
                `/conversations/${conversationId}/favourite`
            );
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to toggle favourite";
            // Revert on failure
            thunkAPI.dispatch(revertFavourite({ conversationId, userId }));
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// ─── CLEAR CHAT ───
export const clearChatThunk = createAsyncThunk(
    "chat/clearChat",
    async (conversationId, thunkAPI) => {
        try {
            await API.put(`/conversations/${conversationId}/clear`);
            return conversationId;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to clear chat";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// ─── TOGGLE MUTE ───
export const toggleMuteThunk = createAsyncThunk(
    "chat/toggleMute",
    async (conversationId, thunkAPI) => {
        try {
            const response = await API.put(
                `/conversations/${conversationId}/mute`
            );
            return { conversationId, muted: response.data.muted };
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to toggle mute";
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
        // Real-time delete for everyone
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
        // Real-time reaction update from socket
        markMessageReacted: (state, action) => {
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
        // Optimistic favourite update
        optimisticToggleFavourite: (state, action) => {
            const { conversationId, userId } = action.payload;
            const index = state.conversations.findIndex(
                (c) => c._id === conversationId
            );
            if (index !== -1) {
                const conv = state.conversations[index];
                const favourites = conv.favourites || [];
                const isFav = favourites.some((id) => String(id) === String(userId));

                if (isFav) {
                    state.conversations[index] = {
                        ...conv,
                        favourites: favourites.filter((id) => String(id) !== String(userId)),
                    };
                } else {
                    state.conversations[index] = {
                        ...conv,
                        favourites: [...favourites, userId],
                    };
                }
            }
        },
        // Revert if API fails
        revertFavourite: (state, action) => {
            const { conversationId, userId } = action.payload;
            const index = state.conversations.findIndex(
                (c) => c._id === conversationId
            );
            if (index !== -1) {
                const conv = state.conversations[index];
                const favourites = conv.favourites || [];
                const isFav = favourites.some((id) => String(id) === String(userId));

                if (isFav) {
                    state.conversations[index] = {
                        ...conv,
                        favourites: favourites.filter((id) => String(id) !== String(userId)),
                    };
                } else {
                    state.conversations[index] = {
                        ...conv,
                        favourites: [...favourites, userId],
                    };
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // ─── Fetch Users ───
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
            // ─── Search Users ───
            .addCase(searchUsers.fulfilled, (state, action) => {
                state.users = action.payload;
            })
            // ─── Create Private Conversation ───
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
            // ─── Create Group Conversation ───
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
            // ─── Fetch Messages ───
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.messages = action.payload;
            })
            // ─── Send Message ───
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
            // ─── Delete for Me ───
            .addCase(deleteMessageForMe.fulfilled, (state, action) => {
                const deletedId = action.payload;
                state.messages = state.messages.filter((m) => m._id !== deletedId);
            })
            // ─── Delete for Everyone ───
            .addCase(deleteMessageForEveryone.fulfilled, (state, action) => {
                const updated = action.payload;
                const index = state.messages.findIndex((m) => m._id === updated._id);
                if (index !== -1) {
                    state.messages[index] = { ...state.messages[index], ...updated };
                }
            })
            // Toggle Favourite
            .addCase(toggleFavouriteThunk.fulfilled, (state, action) => {
                const updated = action.payload;
                const index = state.conversations.findIndex((c) => c._id === updated._id);
                if (index !== -1) {
                    // Preserve existing data + update with server response
                    state.conversations[index] = {
                        ...state.conversations[index],
                        favourites: updated.favourites,
                    };
                }
            })
            // Clear Chat
            .addCase(clearChatThunk.fulfilled, (state, action) => {
                const convId = action.payload;
                if (state.selectedConversation?._id === convId) {
                    state.messages = [];
                }
                // Update conversations list
                const index = state.conversations.findIndex((c) => c._id === convId);
                if (index !== -1) {
                    state.conversations[index].lastMessage = null;
                }
            })
            // Toggle Mute
            .addCase(toggleMuteThunk.fulfilled, (state, action) => {
                const { conversationId, muted } = action.payload;
                const index = state.conversations.findIndex((c) => c._id === conversationId);
                if (index !== -1) {
                    state.conversations[index] = {
                        ...state.conversations[index],
                        _muted: muted,
                    };
                }
            })
            // ─── Toggle Reaction ───
            .addCase(toggleReaction.fulfilled, (state, action) => {
                const updated = action.payload;
                const index = state.messages.findIndex((m) => m._id === updated._id);
                if (index !== -1) {
                    state.messages[index] = { ...state.messages[index], ...updated };
                }
            })
            // ─── Fetch Unread Counts ───
            .addCase(fetchUnreadCounts.fulfilled, (state, action) => {
                state.unreadCounts = action.payload;
            })
            // ─── Delete Conversation ───
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
            // ─── Mark as Read ───
            .addCase(markConversationRead.fulfilled, (state, action) => {
                const otherUserId = action.payload;
                if (otherUserId) {
                    delete state.unreadCounts[otherUserId];
                }
            })
            // ─── Fetch Conversations ───
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
    markMessageReacted,
    optimisticToggleFavourite,
    revertFavourite,
} = chatSlice.actions;

export default chatSlice.reducer;