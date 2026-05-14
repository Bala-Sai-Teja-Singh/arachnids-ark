import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  userId: string;
  targetId: string;
  targetType: 'product' | 'course' | 'consultation';
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: String, required: true, index: true },
    targetId: { type: String, required: true, index: true },
    targetType: { 
      type: String, 
      required: true, 
      enum: ['product', 'course', 'consultation'],
      index: true 
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// Unique compound index to prevent duplicate likes
favoriteSchema.index({ userId: 1, targetId: 1 }, { unique: true });

export const FavoriteModel = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', favoriteSchema);
