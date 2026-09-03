import mongoose from 'mongoose';

const telemetrySnapshotSchema = new mongoose.Schema({
  assetId: {
    type: String,
    required: [true, 'Asset ID is required'],
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  outputMW: {
    type: Number,
    required: [true, 'Output MW is required'],
    min: 0,
  },
  source: {
    type: String,
    enum: ['weather-model', 'scada'],
    default: 'weather-model',
  },
  weatherSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

// Compound index for time-series range queries per asset
telemetrySnapshotSchema.index({ assetId: 1, timestamp: -1 });

export const TelemetrySnapshot =
  mongoose.models.TelemetrySnapshot ||
  mongoose.model('TelemetrySnapshot', telemetrySnapshotSchema);
export default TelemetrySnapshot;
