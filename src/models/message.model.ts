import mongoose, { Schema, Document } from "mongoose";

// Define the interface for Message document
export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  isRead: boolean;
  deletedFor: mongoose.Types.ObjectId[];
}

// Create the Message Schema
const MessageSchema = new Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields automatically
  }
);

// Add indexes for better query performance
MessageSchema.index({ chatId: 1, createdAt: -1 });

// **Pre-save Hook** to Update `lastMessage` in Chat
MessageSchema.post("save", async (doc) => {
  await mongoose.model("Chat").findByIdAndUpdate(doc.chatId, {
    lastMessage: doc.content,
  });
});

// Create and export the model
const Message =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
export default Message;
