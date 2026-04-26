import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { Heart, Send, Loader2, User } from 'lucide-react';

export default function EmotionalSupport() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi, I'm your safety companion. 💜\n\nI'm here to listen, support, and help you through whatever you're facing. You can tell me:\n\n• How you're feeling right now\n• What situation you're dealing with\n• If you need immediate help or resources\n\nEverything here is private. What's on your mind?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await aiAPI.emotionalSupport(userMsg);
      const support = data.support;

      let botText = support.response || (typeof support === 'string' ? support : 'I hear you. Tell me more about how you are feeling.');

      if (support.suggestedActions?.length > 0) {
        botText += '\n\n💡 **Things you can do:**\n' + support.suggestedActions.map(a => `• ${a}`).join('\n');
      }

      if (support.resources?.length > 0) {
        botText += '\n\n📞 **Helplines:**\n' + support.resources.map(r => `• ${r}`).join('\n');
      }

      if (support.needsProfessionalHelp) {
        botText += '\n\n🏥 **I strongly recommend speaking to a professional.** You deserve expert support.';
      }

      setMessages(prev => [...prev, { role: 'bot', text: botText, stress: support.stressLevel }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting right now, but I want you to know that your feelings are valid.\n\nIf you need immediate help:\n• 📞 Women Helpline: 181\n• 📞 Emergency: 112\n• 📞 iCall: 9152987821\n• 📞 Vandrevala Foundation: 1860-2662-345" }]);
    }
    setLoading(false);
  };

  const stressColors = { severe: 'border-l-red-500', high: 'border-l-amber-500', moderate: 'border-l-yellow-500', low: 'border-l-emerald-500' };

  return (
    <PageWrapper title="Emotional Support" subtitle="A safe space to express yourself — AI-guided wellness & safety support">
      <div className="flex flex-col max-w-3xl mx-auto w-full" style={{ minHeight: '65vh' }}>
        <div className="glass-card flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary-500/10' : 'bg-pink-500/10'}`}>
                  {msg.role === 'user' ? <User size={14} className="text-primary-400" /> : <Heart size={14} className="text-pink-400" />}
                </div>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary-500/10 text-surface-200 rounded-br-md' : `bg-surface-800/80 text-surface-200 rounded-bl-md border-l-2 ${stressColors[msg.stress] || 'border-l-transparent'}`}`}>
                  {msg.text.split('**').map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part)}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center"><Heart size={14} className="text-pink-400" /></div>
                <div className="bg-surface-800/80 px-5 py-3 rounded-2xl rounded-bl-md flex items-center gap-2 text-surface-400 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 pt-2 flex gap-2 flex-wrap">
            {['I feel anxious', 'I was harassed', "I'm stressed", 'I need help'].map(q => (
              <button key={q} onClick={() => { setInput(q); }} className="text-xs px-3 py-1.5 rounded-full bg-surface-800 text-surface-400 hover:text-white hover:bg-surface-700 transition-all">{q}</button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                className="input-field flex-1 text-sm" placeholder="How are you feeling today?" disabled={loading} />
              <button onClick={send} disabled={loading || !input.trim()} className="btn-primary px-4"><Send size={18} /></button>
            </div>
            <p className="text-xs text-surface-500 mt-2 text-center">
              This is AI-based support, not a substitute for professional help. Emergency: 112 | Women Helpline: 181
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
