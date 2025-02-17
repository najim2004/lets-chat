import mongoose, { Document, Model } from "mongoose";

// Interface for User document
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar: string;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  friends: mongoose.Types.ObjectId[]; // Add friends list
}

// User schema definition
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/6.x/micah/svg?seed=",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Referencing the User model itself
      },
    ], // Add this to store the list of friends
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for better query performance
UserSchema.index({ email: 1, username: 1 });

// Model type definition
export type UserModel = Model<IUser>;

// Create or get existing model
const User = (mongoose?.models?.User ||
  mongoose.model<IUser>("User", UserSchema)) as UserModel;

export default User;
