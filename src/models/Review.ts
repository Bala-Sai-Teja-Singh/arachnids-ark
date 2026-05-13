import mongoose, { Schema } from 'mongoose';

/**
 * Review model — user reviews for products, courses, and consultations.
 * Reviews go through an approval flow: pending → approved/rejected.
 * Compound index on (targetId, targetType) for efficient per-item queries.
 */

const reviewSchema = new Schema(
  {
    _id: { type: String, required: true },
    targetId: { type: String, required: true },
    targetType: { type: String, enum: ['product', 'course', 'consultation'], required: true },
    userId: { type: String, required: true },
    userName: { type: String },
    userAvatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
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

// Indexes
reviewSchema.index({ targetId: 1, targetType: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ status: 1 });

export const ReviewModel =
  (mongoose.models.Review as mongoose.Model<typeof reviewSchema extends Schema<infer T> ? T : never>) ||
  mongoose.model('Review', reviewSchema);
