import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout
import Navbar from './components/layout/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile/Profile';

// Predict
import MessageAnalyzer from './pages/Predict/MessageAnalyzer';
import IntentDecoder from './pages/Predict/IntentDecoder';
import EscalationTracker from './pages/Predict/EscalationTracker';
import DigitalShadow from './pages/Predict/DigitalShadow';
import ImpersonationDetector from './pages/Predict/ImpersonationDetector';
import AttackSimulation from './pages/Predict/AttackSimulation';

// Protect
import SafetyModes from './pages/Protect/SafetyModes';
import LiveTracking from './pages/Protect/LiveTracking';
import SafeRoute from './pages/Protect/SafeRoute';
import VisualGuide from './pages/Protect/VisualGuide';
import InvisibleMode from './pages/Protect/InvisibleMode';

// Respond
import PanicButton from './pages/Respond/PanicButton';
import TrustedContacts from './pages/Respond/TrustedContacts';
import AutoDefense from './pages/Respond/AutoDefense';

// Prove
import EvidenceVault from './pages/Prove/EvidenceVault';
import LegalReport from './pages/Prove/LegalReport';

// Recovery
import EmotionalSupport from './pages/Recovery/EmotionalSupport';

// Protected Route wrapper — forces login + onboarding for new users
function ProtectedRoute({ children, skipOnboarding }) {
  const { isAuthenticated, loading, needsOnboarding } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Force new users to profile first
  if (needsOnboarding && !skipOnboarding) return <Navigate to="/profile" replace />;
  return children;
}

// Layout wrapper for authenticated pages
function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      {/* Floating Panic Button */}
      <a href="/respond/panic" className="panic-float lg:hidden" aria-label="Emergency">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </a>
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute skipOnboarding><AppLayout><Profile /></AppLayout></ProtectedRoute>} />

      {/* Predict */}
      <Route path="/predict/analyzer" element={<ProtectedRoute><AppLayout><MessageAnalyzer /></AppLayout></ProtectedRoute>} />
      <Route path="/predict/intent" element={<ProtectedRoute><AppLayout><IntentDecoder /></AppLayout></ProtectedRoute>} />
      <Route path="/predict/escalation" element={<ProtectedRoute><AppLayout><EscalationTracker /></AppLayout></ProtectedRoute>} />
      <Route path="/predict/shadow" element={<ProtectedRoute><AppLayout><DigitalShadow /></AppLayout></ProtectedRoute>} />
      <Route path="/predict/impersonation" element={<ProtectedRoute><AppLayout><ImpersonationDetector /></AppLayout></ProtectedRoute>} />
      <Route path="/predict/simulation" element={<ProtectedRoute><AppLayout><AttackSimulation /></AppLayout></ProtectedRoute>} />

      {/* Protect */}
      <Route path="/protect/modes" element={<ProtectedRoute><AppLayout><SafetyModes /></AppLayout></ProtectedRoute>} />
      <Route path="/protect/tracking" element={<ProtectedRoute><AppLayout><LiveTracking /></AppLayout></ProtectedRoute>} />
      <Route path="/protect/safe-route" element={<ProtectedRoute><AppLayout><SafeRoute /></AppLayout></ProtectedRoute>} />
      <Route path="/protect/visual-guide" element={<ProtectedRoute><AppLayout><VisualGuide /></AppLayout></ProtectedRoute>} />
      <Route path="/protect/invisible" element={<ProtectedRoute><AppLayout><InvisibleMode /></AppLayout></ProtectedRoute>} />

      {/* Respond */}
      <Route path="/respond/panic" element={<ProtectedRoute><AppLayout><PanicButton /></AppLayout></ProtectedRoute>} />
      <Route path="/respond/contacts" element={<ProtectedRoute><AppLayout><TrustedContacts /></AppLayout></ProtectedRoute>} />
      <Route path="/respond/defense" element={<ProtectedRoute><AppLayout><AutoDefense /></AppLayout></ProtectedRoute>} />

      {/* Prove */}
      <Route path="/prove/vault" element={<ProtectedRoute><AppLayout><EvidenceVault /></AppLayout></ProtectedRoute>} />
      <Route path="/prove/report" element={<ProtectedRoute><AppLayout><LegalReport /></AppLayout></ProtectedRoute>} />

      {/* Recovery */}
      <Route path="/recovery/support" element={<ProtectedRoute><AppLayout><EmotionalSupport /></AppLayout></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}
