import mongoose from 'mongoose';

const locationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true },
  safetyMode: { type: String, enum: ['traveling', 'cab-ride', 'night-walk', 'online-chat'], required: true },
  path: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    speed: { type: Number },
    heading: { type: Number },
  }],
  plannedRoute: {
    origin: { lat: Number, lng: Number, address: String },
    destination: { lat: Number, lng: Number, address: String },
    waypoints: [{ lat: Number, lng: Number }],
  },
  deviationDetected: { type: Boolean, default: false },
  deviationDetails: [{
    timestamp: Date,
    distanceFromRoute: Number,
    location: { lat: Number, lng: Number },
  }],
  isActive: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
}, { timestamps: true });

const LocationLog = mongoose.model('LocationLog', locationLogSchema);
export default LocationLog;
