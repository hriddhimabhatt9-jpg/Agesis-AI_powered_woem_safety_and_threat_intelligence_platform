import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useDisguise } from '../../context/DisguiseContext';
import { Shield, LayoutDashboard, Brain, MapPin, AlertTriangle, Archive, User, LogOut, Menu, X, Heart, EyeOff } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/predict/analyzer', label: 'AI Predict', icon: Brain },
  { path: '/protect/modes', label: 'Protect', icon: Shield },
  { path: '/maps', label: 'Map', icon: MapPin },
  { path: '/respond/panic', label: 'Alerts', icon: AlertTriangle },
  { path: '/prove/vault', label: 'Evidence', icon: Archive },
  { path: '/recovery/support', label: 'Support', icon: Heart },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toggleDisguise } = useDisguise();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden lg:flex fixed top-0 left-0 right-0 z-40 h-16 bg-surface-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto w-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">AEG</span>
              <span className="text-primary-400">ESIS</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(path) ? 'text-primary-400 bg-primary-500/10' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'}`}>
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Profile */}
            <button onClick={toggleDisguise} className="btn-icon text-surface-500 hover:text-primary-400" title="Stealth Mode">
              <EyeOff size={18} />
            </button>
            <Link to="/profile" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
              ${isActive('/profile') ? 'text-primary-400 bg-primary-500/10' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium">{user?.name?.split(' ')[0] || 'User'}</span>
            </Link>
            <button onClick={handleLogout} className="btn-icon text-surface-500 hover:text-red-400" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </nav>

      {/* Mobile Top Bar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-surface-900/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm">
            <span className="text-white">AEG</span><span className="text-primary-400">ESIS</span>
          </span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-icon text-surface-300">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-surface-900 border-l border-white/5 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-lg text-white">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="btn-icon text-surface-400">
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive(path) ? 'text-primary-400 bg-primary-500/10' : 'text-surface-400 hover:text-white hover:bg-surface-800'}`}>
                    <Icon size={18} /><span>{label}</span>
                  </Link>
                ))}
                <div className="divider" />
                <Link to="/profile" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800">
                  <User size={18} /><span>Profile</span>
                </Link>
                <button onClick={toggleDisguise}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800">
                  <EyeOff size={18} /><span>Stealth Mode</span>
                </button>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 mt-4">
                <LogOut size={18} /><span>Logout</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-900/90 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.slice(0, 5).map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all
                ${isActive(path) ? 'text-primary-400' : 'text-surface-500'}`}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
