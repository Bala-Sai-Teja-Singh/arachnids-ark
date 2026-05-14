import mongoose, { Schema } from 'mongoose';

/**
 * ConsultationSettings model — singleton document storing consultation pricing,
 * urgency multipliers, and available slots.
 */

const consultationPricingSchema = new Schema(
  { duration: Number, basePrice: Number, label: String },
  { _id: false }
);

const urgencyMultiplierSchema = new Schema(
  { urgency: { type: String, enum: ['normal', 'priority', 'emergency'] }, multiplier: Number, label: String },
  { _id: false }
);

const consultationSlotSchema = new Schema(
  { id: String, date: String, time: String, available: { type: Boolean, default: true } },
  { _id: false }
);

const consultationSettingsSchema = new Schema(
  {
    _id: { type: String, default: 'default' },
    pricing: [consultationPricingSchema],
    urgencyMultipliers: [urgencyMultiplierSchema],
    slots: [consultationSlotSchema],
  },
  {
    toJSON: {
      virtuals: true,
      versionKey: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_doc: any, ret: any) => {
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_doc: any, ret: any) => {
        delete ret._id;
        return ret;
      },
    },
    collection: 'consultation-settings'
  }
);

export const ConsultationSettingsModel =
  (mongoose.models.ConsultationSettings as mongoose.Model<typeof consultationSettingsSchema extends Schema<infer T> ? T : never>) ||
  mongoose.model('ConsultationSettings', consultationSettingsSchema);
