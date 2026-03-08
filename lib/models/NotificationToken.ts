import mongoose, { Schema, Document } from "mongoose";

export interface INotificationToken extends Document {
  fid: number;
  token: string;
  notificationUrl: string;
  enabled: boolean;
  lastNotifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTokenSchema = new Schema<INotificationToken>(
  {
    fid: { type: Number, required: true },
    token: { type: String, required: true },
    notificationUrl: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    lastNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One token per Farcaster user
NotificationTokenSchema.index({ fid: 1 }, { unique: true });
// Query index: find all enabled tokens for sending notifications
NotificationTokenSchema.index({ enabled: 1 }, { partialFilterExpression: { enabled: true } });

export const NotificationToken =
  mongoose.models.NotificationToken ||
  mongoose.model<INotificationToken>("NotificationToken", NotificationTokenSchema);
