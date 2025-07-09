import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyType extends Document {
  label: string;
}

const PropertyTypeSchema = new Schema<IPropertyType>({
  label: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes
PropertyTypeSchema.index({ label: 1 });

export const PropertyType = mongoose.model<IPropertyType>('PropertyType', PropertyTypeSchema); 