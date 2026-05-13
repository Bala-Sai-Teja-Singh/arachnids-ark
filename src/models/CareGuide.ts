import mongoose, { Schema } from 'mongoose';

/**
 * CareGuide model — educational care articles for arachnid keeping.
 */

const careGuideSchema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String },
    content: { type: String },
    image: { type: String },
    category: { type: String },
    readTime: { type: String },
  },
  {
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

export const CareGuideModel =
  (mongoose.models.CareGuide as mongoose.Model<typeof careGuideSchema extends Schema<infer T> ? T : never>) ||
  mongoose.model('CareGuide', careGuideSchema);
