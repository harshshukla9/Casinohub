import mongoose from 'mongoose';

export interface IWithdrawal extends mongoose.Document {
  walletAddress: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  transactionHash?: string;
  rejectionReason?: string;
  fid?: number;
  username?: string;
}

const WithdrawalSchema = new mongoose.Schema<IWithdrawal>({
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected'],
    default: 'pending',
    required: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  processedAt: {
    type: Date,
  },
  transactionHash: {
    type: String,
  },
  rejectionReason: {
    type: String,
  },
  fid: {
    type: Number,
  },
  username: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
WithdrawalSchema.index({ walletAddress: 1, requestedAt: -1 });
WithdrawalSchema.index({ status: 1, requestedAt: -1 });

const Withdrawal = mongoose.models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);

export default Withdrawal;

