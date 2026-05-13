import mongoose, { Schema } from 'mongoose';

/**
 * Enrollment model — tracks user course enrollments.
 * Auto-created when an order containing a course is marked payment_verified.
 * Compound index on (userId, courseId) prevents duplicate enrollments.
 */

const enrollmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String },
    userEmail: { type: String },
    courseId: { type: String, required: true },
    courseTitle: { type: String },
    status: { type: String, enum: ['enrolled', 'cancelled'], default: 'enrolled' },
    paymentScreenshot: { type: String },
    adminNote: { type: String },
    totalPrice: { type: Number },
    orderId: { type: String },
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

// Compound index: one enrollment per user per course
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1 });

export const EnrollmentModel =
  (mongoose.models.Enrollment as mongoose.Model<typeof enrollmentSchema extends Schema<infer T> ? T : never>) ||
  mongoose.model('Enrollment', enrollmentSchema);
