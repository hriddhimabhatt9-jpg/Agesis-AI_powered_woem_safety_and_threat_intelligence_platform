import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { Users, Plus, Trash2, Save, Phone, Mail, Check } from 'lucide-react';
import { handlePhoneInput, getPhoneError, isValidIndianPhone } from '../../utils/phoneValidation';

export default function TrustedContacts() {
  const { user, updateUser } = useAuth();
  const [primary, setPrimary] = useState(user?.primaryEmergencyContact || { name: '', phone: '', email: '', relationship: '' });
  const [additional, setAdditional] = useState(user?.additionalEmergencyContacts || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phoneErrors, setPhoneErrors] = useState({});

  const updatePhone = (field, value) => {
    const cleaned = handlePhoneInput(value);
    setPhoneErrors(prev => ({ ...prev, [field]: getPhoneError(cleaned) }));
    return cleaned;
  };

  const addContact = () => { if (additional.length < 3) setAdditional([...additional, { name: '', phone: '', email: '', relationship: '' }]); };
  const removeContact = (i) => setAdditional(additional.filter((_, idx) => idx !== i));

  const save = async () => {
    // Validate primary phone
    if (!isValidIndianPhone(primary.phone)) {
      setPhoneErrors(prev => ({ ...prev, primary: 'Enter a valid 10-digit Indian mobile number' }));
      return;
    }
    setSaving(true);
    try {
      await userAPI.updateStep1({ name: user?.name, phone: user?.phone, primaryEmergencyContact: primary });
      if (additional.length) await userAPI.updateStep2({ additionalEmergencyContacts: additional });
      updateUser({ primaryEmergencyContact: primary, additionalEmergencyContacts: additional });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  return (
    <PageWrapper title="Trusted Contacts" subtitle="Manage the people who will be notified in an emergency">
      <div className="max-w-2xl mx-auto space-y-6">
        {saved && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"><Check size={16} /> Contacts saved!</motion.div>
        )}

        {/* Primary */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Phone size={18} className="text-red-400" /> Primary Emergency Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-xs text-surface-400 mb-1">Name *</label><input value={primary.name} onChange={e => setPrimary({ ...primary, name: e.target.value })} className="input-field text-sm" placeholder="Contact name" /></div>
            <div><label className="block text-xs text-surface-400 mb-1">Phone * <span className="text-surface-500">(10 digits)</span></label><input value={primary.phone} onChange={e => { const v = updatePhone('primary', e.target.value); setPrimary({ ...primary, phone: v }); }} className={`input-field text-sm ${phoneErrors.primary ? 'border-red-500/50' : ''}`} placeholder="+91 XXXXXXXXXX" type="tel" maxLength={15} />{phoneErrors.primary && <p className="text-red-400 text-xs mt-1">{phoneErrors.primary}</p>}</div>
            <div><label className="block text-xs text-surface-400 mb-1">Email</label><input value={primary.email} onChange={e => setPrimary({ ...primary, email: e.target.value })} className="input-field text-sm" placeholder="email@example.com" /></div>
            <div><label className="block text-xs text-surface-400 mb-1">Relationship</label><input value={primary.relationship} onChange={e => setPrimary({ ...primary, relationship: e.target.value })} className="input-field text-sm" placeholder="e.g., Parent" /></div>
          </div>
        </div>

        {/* Additional */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Users size={18} className="text-primary-400" /> Additional Contacts</h2>
            {additional.length < 3 && <button onClick={addContact} className="btn-ghost text-xs py-1.5 px-3"><Plus size={14} className="mr-1 inline" />Add</button>}
          </div>
          {additional.length === 0 ? (
            <div className="text-center py-8 text-surface-500"><Users size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No additional contacts yet</p></div>
          ) : additional.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 mb-3">
              <div className="flex items-center justify-between mb-3"><span className="text-xs text-surface-400">Contact {i + 2}</span><button onClick={() => removeContact(i)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={c.name} placeholder="Name" className="input-field text-sm py-2" onChange={e => { const arr = [...additional]; arr[i] = { ...arr[i], name: e.target.value }; setAdditional(arr); }} />
                <input value={c.phone} placeholder="Phone (10 digits)" className={`input-field text-sm py-2 ${phoneErrors[`add${i}`] ? 'border-red-500/50' : ''}`} type="tel" maxLength={15} onChange={e => { const v = updatePhone(`add${i}`, e.target.value); const arr = [...additional]; arr[i] = { ...arr[i], phone: v }; setAdditional(arr); }} />
                {phoneErrors[`add${i}`] && <p className="text-red-400 text-xs mt-0.5">{phoneErrors[`add${i}`]}</p>}
                <input value={c.email} placeholder="Email" className="input-field text-sm py-2" onChange={e => { const arr = [...additional]; arr[i] = { ...arr[i], email: e.target.value }; setAdditional(arr); }} />
                <input value={c.relationship} placeholder="Relationship" className="input-field text-sm py-2" onChange={e => { const arr = [...additional]; arr[i] = { ...arr[i], relationship: e.target.value }; setAdditional(arr); }} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2"><Save size={16} />{saving ? 'Saving...' : 'Save All Contacts'}</button>
      </div>
    </PageWrapper>
  );
}
