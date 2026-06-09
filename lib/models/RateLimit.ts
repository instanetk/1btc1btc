import mongoose, { Schema, Document } from "mongoose";

// Fixed-window rate-limit counter, shared across serverless instances.
// `key` encodes the scope + window start (e.g. "generate:ip:1.2.3.4:28461234").
export interface IRateLimit extends Document {
  key: string;
  count: number;
  expiresAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

// TTL index: MongoDB removes documents once the window has elapsed.
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
