import mongoose, { Schema } from 'mongoose';

/**
 * Booking model — consultation bookings with nested session slots.
 * Supports the talktime model where users buy minutes and schedule multiple slots.
 */

const bookingSlotSchema = new Schema(
  {
    id: { type: String },
    date: { type: String },
    time: { type: String },
    duration: { type: Number },
    status: { type: String, enum: ['payment_verified', 'scheduled', 'completed', 'cancelled'] },
    meetingLink: { type: String },
    recordingUrl: { type: String },
    minutesUsed: { type: Number },
  },
  { _id: false }
);

const bookingItemSchema = new Schema(
  {
    duration: { type: Number },
    quantity: { type: Number },
    label: { type: String },
    basePrice: { type: Number },
    urgency: { type: String, enum: ['normal', 'priority', 'emergency'] },
    status: { type: String, enum: ['payment_verified', 'scheduled', 'completed', 'cancelled'] },
    minutesUsed: { type: Number },
    meetingLink: { type: String },
    recordingUrl: { type: String },
    slots: [bookingSlotSchema],
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String },
    userEmail: { type: String },
    duration: { type: Number },
    urgency: { type: String, enum: ['normal', 'priority', 'emergency'] },
    slotId: { type: String },
    slotDate: { type: String },
    slotTime: { type: String },
    query: { type: String },
    basePrice: { type: Number },
    multiplier: { type: Number },
    totalPrice: { type: Number },
    status: {
      type: String,
      enum: ['payment_verified', 'scheduled', 'completed', 'cancelled'],
      default: 'payment_verified',
    },
    paymentScreenshot: { type: String },
    adminNote: { type: String },
    minutesUsed: { type: Number },
    items: [bookingItemSchema],
    orderId: { type: String },
    recordingUrl: { type: String },
    meetingLink: { type: String },
    likes: { type: Number, default: 0 },
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

export const BookingModel =
  (mongoose.models.Booking as mongoose.Model<typeof bookingSchema extends Schema<infer T> ? T : never>) ||
  mongoose.model('Booking', bookingSchema);
