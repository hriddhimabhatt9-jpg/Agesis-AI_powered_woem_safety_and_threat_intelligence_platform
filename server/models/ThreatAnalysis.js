import mongoose from 'mongoose';

const threatAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['message-analysis', 'intent-decode', 'escalation-check', 'digital-shadow', 'impersonation', 'attack-simulation'],
    required: true,
  },
  inputData: {
    text: { type: String },
    conversationHistory: [{ role: String, content: String }],
    searchQuery: { type: String },
  },
  results: {
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    riskScore: { type: Number, min: 0, max: 100 },
    category: { type: String },
    explanation: { type: String },
    detectedPatterns: [{ type: String }],
    suggestedActions: [{ type: String }],
    psychologicalIntent: { type: String },
    escalationHistory: [{
      date: Date,
      riskScore: Number,
      summary: String,
    }],
    exposureData: {
      breaches: [{ source: String, date: String, dataTypes: [String] }],
      publicProfiles: [{ platform: String, url: String }],
    },
    impersonationMatches: [{
      platform: String,
      similarity: Number,
      url: String,
    }],
    attackSteps: [{
      step: Number,
      phase: String,
      description: String,
      indicators: [String],
    }],
  },
  savedToVault: { type: Boolean, default: false },
}, { timestamps: true });

const ThreatAnalysis = mongoose.model('ThreatAnalysis', threatAnalysisSchema);
export default ThreatAnalysis;
