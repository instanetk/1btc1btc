import mongoose, { Schema, Document } from "mongoose";

// Persists the last on-chain block processed by the chain sync, so the cursor
// survives process restarts (no replaying or skipping events across deploys).
export interface ISyncState extends Document {
  key: string;
  lastBlock: number;
  updatedAt: Date;
}

const SyncStateSchema = new Schema<ISyncState>(
  {
    key: { type: String, required: true, unique: true },
    lastBlock: { type: Number, required: true },
  },
  { timestamps: true }
);

export const SyncState =
  mongoose.models.SyncState ||
  mongoose.model<ISyncState>("SyncState", SyncStateSchema);
