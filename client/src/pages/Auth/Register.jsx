import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const loadingRef = useRef(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    loadingRef.current = true;

    const timeout = setTimeout(() => {
      if (loadingRef.current) {
        setLoading(false);
        loadingRef.current = false;
        setError('Request timed out. Please try again.');
      }
    }, 15000);

    try {
      await register(form);
      clearTimeout(timeout);
      loadingRef.current = false;
      navigate('/profile');
    } catch (err) {
      clearTimeout(timeout);
      loadingRef.current = false;
      const data = err.response?.data;
      let msg = data?.error || err.message || 'Registration failed.';
      
      if (data?.details && Array.isArray(data.details)) {
        msg = `${msg}: ${data.details.map(d => d.message).join(', ')}`;
      }
      
      setError(msg);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Load Google Sign-In script
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your-google-client-id') return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            setError('');
            setLoading(true);
            try {
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              await googleLogin({
                credential: response.credential,
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
              });
              navigate('/profile');
            } catch (err) {
              setError(err.response?.data?.error || 'Google sign-in failed.');
            } finally {
              setLoading(false);
            }
          },
        });
        const buttonDiv = document.getElementById('google-signup-btn');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            text: 'signup_with',
            shape: 'pill',
          });
        }
      }
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
              <AlertCircle size={16} className="shrink-0" /><span>{error}</span>
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
                    className="input-field pl-10" placeholder={placeholder} id={`register-${name}`} />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-10 pr-10" placeholder="Min 6 characters" id="register-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2" id="register-submit">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Google Sign-Up */}
          <div className="mt-5">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-surface-700" />
              <span className="text-surface-500 text-xs uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-surface-700" />
            </div>
            <div id="google-signup-btn" className="flex justify-center" />
          </div>

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
