import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  type: mongoose.Types.ObjectId;
  price: number;
  description: string;
  images: string[]; // UUID list
  created_at: Date;
}

const PropertySchema = new Schema<IProperty>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: Schema.Types.ObjectId,
    ref: 'PropertyType',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String,
    required: false
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes
PropertySchema.index({ title: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ created_at: -1 });

export const Property = mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema); 