import mongoose, { Schema, Document } from "mongoose";

export interface IAnalogy extends Document {
  text: string;
  domain: string;
  minted: boolean;
  minterAddress: string | null;
  tokenId: number | null;
  txHash: string | null;
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnalogySchema = new Schema<IAnalogy>(
  {
    text: { type: String, required: true },
    domain: { type: String, required: true },
    minted: { type: Boolean, default: false },
    minterAddress: { type: String, default: null },
    tokenId: { type: Number, default: null },
    txHash: { type: String, default: null },
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Gallery query index: minted NFTs sorted by upvotes (top) or tokenId (newest)
AnalogySchema.index({ minted: 1, upvotes: -1, tokenId: -1 });
// Unique sparse index for tokenId lookups (null tokenIds are excluded)
AnalogySchema.index({ tokenId: 1 }, { unique: true, sparse: true });

export const Analogy =
  mongoose.models.Analogy || mongoose.model<IAnalogy>("Analogy", AnalogySchema);
