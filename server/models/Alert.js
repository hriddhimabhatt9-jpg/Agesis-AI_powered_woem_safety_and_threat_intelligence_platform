import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['panic', 'auto-trigger', 'high-risk', 'deviation', 'distress'],
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'acknowledged', 'resolved', 'failed'],
    default: 'sent',
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
    googleMapsLink: { type: String },
  },
  message: { type: String },
  contactsNotified: [{
    name: String,
    phone: String,
    email: String,
    notifiedVia: { type: String, enum: ['sms', 'email', 'push', 'socket'] },
    deliveredAt: Date,
  }],
  triggerSource: { type: String },
  resolvedAt: { type: Date },
}, { timestamps: true });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
