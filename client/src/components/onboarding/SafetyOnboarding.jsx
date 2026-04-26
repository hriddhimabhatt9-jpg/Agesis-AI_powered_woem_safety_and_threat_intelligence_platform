import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Phone, MapPin, EyeOff, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    title: "Welcome to AEGESIS",
    desc: "Your personal AI-powered safety shield. Let's set up your core protection in 3 quick steps.",
    icon: Shield,
    color: "bg-primary-500",
  },
  {
    title: "Trusted Contacts",
    desc: "Add at least one emergency contact. They will receive your location if you trigger an SOS.",
    icon: Phone,
    color: "bg-emerald-500",
    action: { label: "Configure Contacts", link: "/respond/contacts" }
  },
  {
    title: "Stealth Mode",
    desc: "Enable 'Disguise Mode' to camouflage this app as a news feed. Triple tap anywhere to toggle.",
    icon: EyeOff,
    color: "bg-blue-500",
  },
  {
    title: "All Set!",
    desc: "You are now under AEGESIS protection. Explore your dashboard to activate safety modes.",
    icon: CheckCircle2,
    color: "bg-purple-500",
    action: { label: "Go to Dashboard", link: "/dashboard" }
  }
];

export default function SafetyOnboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] bg-surface-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card max-w-md w-full p-8 relative z-10"
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className={`w-16 h-16 rounded-2xl ${step.color} mx-auto mb-6 flex items-center justify-center shadow-lg shadow-${step.color.split('-')[1]}-500/20`}>
              <step.icon size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
            <p className="text-surface-400 leading-relaxed mb-8">{step.desc}</p>

            {step.action && (
              <Link 
                to={step.action.link} 
                className="btn-secondary w-full mb-4 inline-flex items-center justify-center gap-2"
              >
                {step.action.label}
              </Link>
            )}

            <button 
              onClick={next}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {currentStep === steps.length - 1 ? "Finish Setup" : "Continue"} <ChevronRight size={18} />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary-500' : 'w-1.5 bg-surface-700'}`} 
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
