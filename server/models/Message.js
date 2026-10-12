import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            default: "",
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
        readAt: {
            type: Date,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        reactions: {
            type: Map,
            of: [mongoose.Schema.Types.ObjectId],
            default: {},
        },
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;