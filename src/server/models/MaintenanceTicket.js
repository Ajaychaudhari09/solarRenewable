import mongoose from 'mongoose';

const maintenanceTicketSchema = new mongoose.Schema({
  assetId: {
    type: String,
    required: [true, 'Asset ID is required'],
    index: true,
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  recommendedAction: {
    type: String,
    required: [true, 'Recommended action is required'],
  },
  estimatedDowntimeHrs: {
    type: Number,
    default: 4,
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open',
  },
  assignedTo: {
    type: String,
    default: 'Operations Team',
  },
  notes: {
    type: String,
    default: '',
  },
  graniteRationale: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
});

export const MaintenanceTicket =
  mongoose.models.MaintenanceTicket ||
  mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
export default MaintenanceTicket;
