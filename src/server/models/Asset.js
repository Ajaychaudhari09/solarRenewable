import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  assetId: {
    type: String,
    required: [true, 'Asset ID is required'],
    unique: true,
    trim: true,
  },
  siteName: {
    type: String,
    enum: ['Kutch', 'Banaskantha'],
    required: [true, 'Site name must be either Kutch or Banaskantha'],
  },
  type: {
    type: String,
    enum: ['solar', 'wind'],
    required: [true, 'Asset type must be either solar or wind'],
  },
  capacityMW: {
    type: Number,
    required: [true, 'Capacity in MW is required'],
    min: 0,
  },
  lat: {
    type: Number,
    required: [true, 'Latitude is required'],
  },
  long: {
    type: Number,
    required: [true, 'Longitude is required'],
  },
  installDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['operational', 'degraded', 'maintenance', 'offline'],
    default: 'operational',
  },
  createdBy: {
    type: String,
    default: 'system',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

assetSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Asset = mongoose.models.Asset || mongoose.model('Asset', assetSchema);
export default Asset;
