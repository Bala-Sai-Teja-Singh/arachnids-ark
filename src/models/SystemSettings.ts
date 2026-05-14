import mongoose, { Schema } from 'mongoose';

/**
 * SystemSettings model — singleton document storing platform-wide config.
 * Uses fixed _id 'default' to ensure only one document exists.
 */

const upiIdSchema = new Schema(
  { id: String, label: String, value: String, isDefault: { type: Boolean, default: false } },
  { _id: false }
);

const shippingRuleSchema = new Schema(
  { id: String, minQuantity: Number, maxQuantity: Number, charge: Number },
  { _id: false }
);

const systemSettingsSchema = new Schema(
  {
    _id: { type: String, default: 'default' },
    upiIds: [upiIdSchema],
    bankDetails: { type: String },
    paymentInstructions: { type: String },
    emailNotifications: {
      orderConfirmations: { type: Boolean, default: true },
      paymentVerification: { type: Boolean, default: true },
      consultationReminders: { type: Boolean, default: true },
    },
    storeStatus: {
      maintenanceMode: { type: Boolean, default: false },
      acceptingConsultations: { type: Boolean, default: true },
    },
    modules: {
      showCourses: { type: Boolean, default: true },
      showProducts: { type: Boolean, default: true },
      showConsultations: { type: Boolean, default: true },
    },
    shippingSettings: {
      rules: [shippingRuleSchema],
      disclaimer: { type: String },
    },
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
    collection: 'system-settings',
  }
);

export const SystemSettingsModel =
  (mongoose.models.SystemSettings as mongoose.Model<typeof systemSettingsSchema extends Schema<infer T> ? T : never>) ||
  mongoose.model('SystemSettings', systemSettingsSchema);
