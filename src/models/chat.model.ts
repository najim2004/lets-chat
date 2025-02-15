import mongoose, { Document, Model, Schema } from "mongoose";

// Interface for Chat document
interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: string;
  updatedAt: Date;
}

// Chat Schema definition
const ChatSchema = new Schema<IChat>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }],
  lastMessage: {
    type: String,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
});

// Index for better query performance
ChatSchema.index({ participants: 1 });

// Model declaration with type safety
const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

export type { IChat };
export default Chat;
