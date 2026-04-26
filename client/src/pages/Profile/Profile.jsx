import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { User, Phone, MapPin, Briefcase, Shield, Save, Plus, Trash2, Check, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const { user, updateUser, completeOnboarding, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(user?.profileCompleted ? 'view' : (user?.onboardingStep || 1));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const [step1, setStep1] = useState({
    name: user?.name || '', phone: user?.phone || '',
    primaryEmergencyContact: user?.primaryEmergencyContact || { name: '', phone: '', email: '', relationship: '' },
  });

  const [step2, setStep2] = useState({
    ageGroup: user?.ageGroup || '', profession: user?.profession || '',
    approximateLocation: user?.approximateLocation || '',
    additionalEmergencyContacts: user?.additionalEmergencyContacts || [],
  });

  const [privacy, setPrivacy] = useState(user?.privacySettings || { showLocation: false, showPhone: false, showProfession: false });

  const handleStep1 = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.updateStep1(step1);
      updateUser(data.user);
    } catch {
      // Save locally in demo mode
      updateUser({ ...step1, primaryEmergencyContact: step1.primaryEmergencyContact });
    }
    // Save contacts to localStorage for panic button
    const contacts = [step1.primaryEmergencyContact].filter(c => c.name);
    localStorage.setItem('aegesis_contacts', JSON.stringify(contacts));
    setSuccess('Step 1 saved!');
    setStep(2);
    setSaving(false);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.updateStep2(step2);
      updateUser(data.user);
    } catch {
      updateUser(step2);
    }
    // Merge all contacts to localStorage
    const allContacts = [
      ...(step1.primaryEmergencyContact?.name ? [step1.primaryEmergencyContact] : []),
      ...step2.additionalEmergencyContacts.filter(c => c.name),
    ];
    localStorage.setItem('aegesis_contacts', JSON.stringify(allContacts));
    completeOnboarding();
    setSuccess('Profile completed! Redirecting...');
    setStep('view');
    setSaving(false);
    setTimeout(() => { setSuccess(''); navigate('/dashboard'); }, 1500);
  };

  const handlePrivacy = async () => {
    try {
      await userAPI.updatePrivacy(privacy);
      updateUser({ privacySettings: privacy });
      setSuccess('Privacy updated');
      setTimeout(() => setSuccess(''), 2000);
    } catch {}
  };

  const addContact = () => {
    if (step2.additionalEmergencyContacts.length < 3) {
      setStep2({ ...step2, additionalEmergencyContacts: [...step2.additionalEmergencyContacts, { name: '', phone: '', email: '', relationship: '' }] });
    }
  };

  const removeContact = (i) => {
    setStep2({ ...step2, additionalEmergencyContacts: step2.additionalEmergencyContacts.filter((_, idx) => idx !== i) });
  };

  return (
    <PageWrapper title="Profile" subtitle="Manage your information and emergency contacts">
      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <Check size={16} />{success}
        </motion.div>
      )}

      {/* Step Indicator */}
      {step !== 'view' && (
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step >= s ? 'bg-primary-500 text-white' : 'bg-surface-700 text-surface-400'}`}>{s}</div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-surface-500'}`}>
                {s === 1 ? 'Required Info' : 'Optional Info'}
              </span>
              {s === 1 && <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary-500' : 'bg-surface-700'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleStep1} className="glass-card p-6 sm:p-8 max-w-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2"><User size={20} className="text-primary-400" /> Basic Information</h2>
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name *</label>
              <input required value={step1.name} onChange={e => setStep1({ ...step1, name: e.target.value })} className="input-field" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Phone Number *</label>
              <input required value={step1.phone} onChange={e => setStep1({ ...step1, phone: e.target.value })} className="input-field" placeholder="+91 XXXXXXXXXX" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Phone size={18} className="text-red-400" /> Primary Emergency Contact</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Contact Name *</label>
              <input required value={step1.primaryEmergencyContact.name} className="input-field" placeholder="Contact name"
                onChange={e => setStep1({ ...step1, primaryEmergencyContact: { ...step1.primaryEmergencyContact, name: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Contact Phone *</label>
              <input required value={step1.primaryEmergencyContact.phone} className="input-field" placeholder="+91 XXXXXXXXXX"
                onChange={e => setStep1({ ...step1, primaryEmergencyContact: { ...step1.primaryEmergencyContact, phone: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Contact Email</label>
              <input type="email" value={step1.primaryEmergencyContact.email} className="input-field" placeholder="contact@email.com"
                onChange={e => setStep1({ ...step1, primaryEmergencyContact: { ...step1.primaryEmergencyContact, email: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Relationship</label>
              <input value={step1.primaryEmergencyContact.relationship} className="input-field" placeholder="e.g., Parent, Friend"
                onChange={e => setStep1({ ...step1, primaryEmergencyContact: { ...step1.primaryEmergencyContact, relationship: e.target.value } })} />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={16} className="mr-2 inline" />{saving ? 'Saving...' : 'Continue to Step 2'}
          </button>
        </motion.form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleStep2} className="glass-card p-6 sm:p-8 max-w-2xl">
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2"><Briefcase size={20} className="text-primary-400" /> Additional Information</h2>
          <p className="text-surface-400 text-sm mb-6">This information is optional but helps improve safety recommendations.</p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Age Group</label>
              <select value={step2.ageGroup} onChange={e => setStep2({ ...step2, ageGroup: e.target.value })} className="input-field">
                <option value="">Select</option>
                <option value="18-24">18–24</option><option value="25-34">25–34</option>
                <option value="35-44">35–44</option><option value="45-54">45–54</option><option value="55+">55+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Profession</label>
              <input value={step2.profession} onChange={e => setStep2({ ...step2, profession: e.target.value })} className="input-field" placeholder="e.g., Student, Engineer" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Approximate Location</label>
              <input value={step2.approximateLocation} onChange={e => setStep2({ ...step2, approximateLocation: e.target.value })} className="input-field" placeholder="e.g., Delhi, India" />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Additional Emergency Contacts</h3>
              {step2.additionalEmergencyContacts.length < 3 && (
                <button type="button" onClick={addContact} className="btn-ghost text-xs py-1.5 px-3"><Plus size={14} className="mr-1 inline" />Add</button>
              )}
            </div>
            {step2.additionalEmergencyContacts.map((c, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-surface-400">Contact {i + 1}</span>
                  <button type="button" onClick={() => removeContact(i)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={c.name} placeholder="Name" className="input-field text-sm py-2"
                    onChange={e => { const arr = [...step2.additionalEmergencyContacts]; arr[i] = { ...arr[i], name: e.target.value }; setStep2({ ...step2, additionalEmergencyContacts: arr }); }} />
                  <input value={c.phone} placeholder="Phone" className="input-field text-sm py-2"
                    onChange={e => { const arr = [...step2.additionalEmergencyContacts]; arr[i] = { ...arr[i], phone: e.target.value }; setStep2({ ...step2, additionalEmergencyContacts: arr }); }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Complete Profile'}</button>
            <button type="button" onClick={() => setStep('view')} className="btn-ghost text-sm">Skip</button>
          </div>
        </motion.form>
      )}

      {/* View Mode */}
      {step === 'view' && (
        <div className="max-w-2xl space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Information</h2>
              <button onClick={() => setStep(1)} className="btn-ghost text-xs py-1.5 px-3">Edit</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Name', value: user?.name },
                { label: 'Email', value: user?.email },
                { label: 'Phone', value: user?.phone || 'Not set' },
                { label: 'Location', value: user?.approximateLocation || 'Not set' },
                { label: 'Age Group', value: user?.ageGroup || 'Not set' },
                { label: 'Profession', value: user?.profession || 'Not set' },
              ].map((item, i) => (
                <div key={i}>
                  <span className="text-xs text-surface-500 uppercase tracking-wider">{item.label}</span>
                  <p className="text-white text-sm font-medium mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Privacy */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Shield size={18} className="text-primary-400" /> Privacy Controls</h2>
            <div className="space-y-3">
              {[
                { key: 'showLocation', label: 'Show Location' },
                { key: 'showPhone', label: 'Show Phone Number' },
                { key: 'showProfession', label: 'Show Profession' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50">
                  <span className="text-sm text-surface-300">{label}</span>
                  <button onClick={() => { const p = { ...privacy, [key]: !privacy[key] }; setPrivacy(p); }}
                    className={`w-10 h-6 rounded-full transition-all ${privacy[key] ? 'bg-primary-500' : 'bg-surface-600'} relative`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${privacy[key] ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handlePrivacy} className="btn-primary text-sm mt-4 py-2">Save Privacy Settings</button>
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
}
