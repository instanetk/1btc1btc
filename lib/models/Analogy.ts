import mongoose, { Schema, Document } from "mongoose";

export interface IAnalogy extends Document {
  text: string;
  domain: string;
  minted: boolean;
  minterAddress: string | null;
  tokenId: number | null;
  txHash: string | null;
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
  },
  { timestamps: true }
);

export const Analogy =
  mongoose.models.Analogy || mongoose.model<IAnalogy>("Analogy", AnalogySchema);
