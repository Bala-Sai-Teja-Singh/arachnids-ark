import mongoose, { Schema } from 'mongoose';

/**
 * Course model — educational content with video lessons.
 * Courses are unlocked when a related order is marked as payment_verified.
 */

const courseSchema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    thumbnail: { type: String },
    contentPreview: { type: String },
    videoUrl: { type: String },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    duration: { type: String },
    featured: { type: Boolean, default: false },
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

export const CourseModel =
  (mongoose.models.Course as mongoose.Model<typeof courseSchema extends Schema<infer T> ? T : never>) ||
  mongoose.model('Course', courseSchema);
