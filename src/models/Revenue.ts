import mongoose, { Schema } from 'mongoose';

const revenueSchema = new Schema(
  {
    _id: { type: String, required: true }, // Source ID (Order ID, Enrollment ID, Booking ID)
    sourceType: { type: String, enum: ['order', 'enrollment', 'booking'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    sourceCreatedAt: { type: Date, required: true }, // To track when the revenue was originally generated
    customerName: { type: String, default: 'Unknown' },
    customerEmail: { type: String, default: 'Unknown' },
    itemName: { type: String, default: 'Multiple Items' },
    orderId: { type: String, default: null }, // If this revenue is part of a larger order
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

revenueSchema.index({ status: 1 });
revenueSchema.index({ sourceType: 1 });
revenueSchema.index({ sourceCreatedAt: -1 });

export const RevenueModel =
  (mongoose.models.Revenue as mongoose.Model<typeof revenueSchema extends Schema<infer T> ? T : never>) ||
  mongoose.model('Revenue', revenueSchema);
