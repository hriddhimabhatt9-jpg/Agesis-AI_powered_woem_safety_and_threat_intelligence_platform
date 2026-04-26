import React from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import { FileText, Shield, Scale, ClipboardList, PhoneCall, ChevronRight } from 'lucide-react';

const roadmapSteps = [
  {
    title: "Secure Evidence",
    desc: "Download all reports from your Evidence Vault immediately. Ensure timestamps and metadata are preserved.",
    icon: ClipboardList,
    color: "text-blue-400",
    tips: ["Download PDF reports", "Export chat logs", "Backup to encrypted drive"]
  },
  {
    title: "Local Law Enforcement",
    desc: "Visit your nearest police station to file a First Information Report (FIR). Show them the AEGESIS evidence reports.",
    icon: Shield,
    color: "text-emerald-400",
    tips: ["Ask for a copy of the FIR", "Note the officer's name/ID", "Provide specific dates/times"]
  },
  {
    title: "Cyber Cell Reporting",
    desc: "For online harassment, report the incident on the National Cyber Crime Reporting Portal (cybercrime.gov.in).",
    icon: Scale,
    color: "text-amber-400",
    tips: ["Upload AEGESIS logs", "Provide social media links", "Use the 'Women/Child' section"]
  },
  {
    title: "Legal Consultation",
    desc: "Contact a legal professional specializing in cyber law or women's safety for specialized advice.",
    icon: FileText,
    color: "text-purple-400",
    tips: ["Review evidence admissibility", "Plan next legal steps", "Maintain confidentiality"]
  }
];

export default function LegalRoadmap() {
  return (
    <PageWrapper title="Post-Incident Roadmap" subtitle="A structured guide on how to proceed legally after an incident occurs.">
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6">
          {roadmapSteps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex flex-col md:flex-row gap-6 items-start"
            >
              <div className={`w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center flex-shrink-0 border border-white/5`}>
                <step.icon size={28} className={step.color} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest bg-surface-800 px-2 py-1 rounded">Step 0{i+1}</span>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                </div>
                <p className="text-surface-400 text-sm leading-relaxed mb-4">{step.desc}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {step.tips.map((tip, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-surface-300">
                      <div className="w-1 h-1 rounded-full bg-primary-500" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              <div className="self-center">
                <ChevronRight className="text-surface-700 hidden md:block" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Emergency Resources */}
        <div className="mt-12 glass-card p-8 bg-gradient-to-br from-primary-600/10 to-transparent border-primary-500/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <PhoneCall size={32} className="text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Need Immediate Legal Help?</h2>
              <p className="text-surface-400 text-sm">Our partner legal experts are available for anonymous consultation.</p>
            </div>
            <button className="btn-primary whitespace-nowrap">Connect with Expert</button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
