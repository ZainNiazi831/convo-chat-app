import mongoose from "mongoose";
import dotenv from "dotenv";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";

dotenv.config();

const cleanup = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const convos = await Conversation.find({ type: "private" }).populate(
        "members",
        "name username"
    );

    console.log(`\n📋 Found ${convos.length} private conversations:\n`);

    // Group by member pair
    const pairs = new Map();
    for (const c of convos) {
        const memberIds = c.members.map((m) => m._id.toString()).sort();
        const key = memberIds.join(" ↔ ");
        const names = c.members.map((m) => m.name).join(" ↔ ");

        if (!pairs.has(key)) pairs.set(key, []);
        pairs.get(key).push({ convo: c, names });
        console.log(`  ${names}  |  ID: ${c._id}`);
    }

    // Delete duplicates
    let deleted = 0;
    for (const [key, list] of pairs.entries()) {
        if (list.length > 1) {
            console.log(`\n⚠️  Duplicate found: ${list[0].names} (${list.length} convos)`);
            // Keep first (oldest), delete rest
            for (let i = 1; i < list.length; i++) {
                const convoId = list[i].convo._id;
                // Delete messages too
                await Message.deleteMany({ conversation: convoId });
                await list[i].convo.deleteOne();
                console.log(`  🗑️  Deleted: ${convoId}`);
                deleted++;
            }
        }
    }

    console.log(`\n✅ Done. Deleted ${deleted} duplicate conversation(s).`);
    process.exit(0);
};

cleanup().catch((e) => {
    console.error("Error:", e);
    process.exit(1);
});