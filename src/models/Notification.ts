import mongoose, { Schema } from 'mongoose';

/**
 * Notification model — user-scoped notifications for orders, payments, bookings, etc.
 * Indexed on userId for efficient per-user queries.
 */

const notificationSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'payment', 'order', 'booking'],
      default: 'info',
    },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Sort by newest first
notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<typeof notificationSchema extends Schema<infer T> ? T : never>) ||
  mongoose.model('Notification', notificationSchema);
