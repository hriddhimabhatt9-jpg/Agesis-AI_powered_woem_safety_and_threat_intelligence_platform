import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['message', 'screenshot', 'log', 'analysis', 'location', 'other'],
    default: 'other',
  },
  content: { type: String },
  metadata: {
    source: { type: String },
    ipAddress: { type: String },
    deviceInfo: { type: String },
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
  },
  threatAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'ThreatAnalysis' },
  tags: [{ type: String }],
  encrypted: { type: Boolean, default: false },
}, { timestamps: true });

const Evidence = mongoose.model('Evidence', evidenceSchema);
export default Evidence;
