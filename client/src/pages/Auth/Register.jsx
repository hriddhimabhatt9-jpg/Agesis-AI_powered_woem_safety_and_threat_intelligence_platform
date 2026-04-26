import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);

    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Request timed out. Please try again.');
      }
    }, 15000);

    try {
      await register(form);
      clearTimeout(timeout);
      navigate('/profile');
    } catch (err) {
      clearTimeout(timeout);
      const data = err.response?.data;
      let msg = data?.error || err.message || 'Registration failed.';
      
      if (data?.details && Array.isArray(data.details)) {
        msg = `${msg}: ${data.details.map(d => d.message).join(', ')}`;
      }
      
      setError(msg);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', icon: User, placeholder: 'Jane Doe', required: true },
    { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@example.com', required: true },
    { name: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, placeholder: '+91 XXXXXXXXXX', required: false },
  ];

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-primary-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Shield size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold"><span className="text-white">AEG</span><span className="text-primary-400">ESIS</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-surface-400 text-sm mt-1">Start your safety journey today</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ name, label, type, icon: Icon, placeholder, required }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
                  <input type={type} required={required} value={form[name]}
                    onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                    className="input-field pl-10" placeholder={placeholder} />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-10 pr-10" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-surface-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
