// models/user.ts
import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  username: string;
  walletAddress: string;
  fid: number;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalBets?: number;
  totalWinnings?: number;
  lastTransactionHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    walletAddress: { type: String, required: true, unique: true }, // Only walletAddress is unique
    fid: { type: Number, required: true }, // FID is not unique
    balance: { type: Number, default: 0 }, // current STT balance
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalBets: { type: Number, default: 0 },
    totalWinnings: { type: Number, default: 0 },
    lastTransactionHash: { type: String, required: false },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model<IUser>("User", userSchema);
export default User;
