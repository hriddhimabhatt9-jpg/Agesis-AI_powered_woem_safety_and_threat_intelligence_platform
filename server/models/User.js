import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  relationship: { type: String, trim: true },
});

const userSchema = new mongoose.Schema({
  // Auth fields
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  googleId: { type: String, sparse: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

  // Step 1 (Required)
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  primaryEmergencyContact: emergencyContactSchema,

  // Step 2 (Optional)
  ageGroup: { type: String, enum: ['18-24', '25-34', '35-44', '45-54', '55+', ''], default: '' },
  profession: { type: String, trim: true, default: '' },
  approximateLocation: { type: String, trim: true, default: '' },
  additionalEmergencyContacts: { type: [emergencyContactSchema], default: [], validate: [v => v.length <= 3, 'Max 3 additional contacts'] },

  // Profile settings
  profileCompleted: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 1 },
  privacySettings: {
    showLocation: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showProfession: { type: Boolean, default: false },
  },

  // Safety settings
  activeSafetyMode: { type: String, enum: ['none', 'traveling', 'cab-ride', 'night-walk', 'online-chat'], default: 'none' },
  defenseMode: { type: String, enum: ['passive', 'active', 'aggressive'], default: 'passive' },
  invisibleModeEnabled: { type: Boolean, default: false },

  // Avatar
  avatar: { type: String, default: '' },
  
  // Timestamps
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
