import React from 'react';
import { Search, Menu, User, TrendingUp, Clock, Share2, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_NEWS = [
  { id: 1, title: 'Local Tech Hub Expansion Announced', category: 'Technology', time: '2h ago', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop' },
  { id: 2, title: 'New Public Transit Routes for Next Month', category: 'City News', time: '4h ago', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=500&auto=format&fit=crop' },
  { id: 3, title: 'Top 10 Healthy Breakfast Recipes', category: 'Lifestyle', time: '5h ago', image: 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?q=80&w=500&auto=format&fit=crop' },
  { id: 4, title: 'Global Markets Show Steady Growth', category: 'Finance', time: '6h ago', image: 'https://images.unsplash.com/photo-1611974714014-4b521237399b?q=80&w=500&auto=format&fit=crop' },
];

export default function DecoyNews() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Menu className="text-gray-600" size={24} />
          <h1 className="text-xl font-serif font-black tracking-tighter">DAILY PULSE</h1>
          <div className="flex items-center gap-4">
            <Search className="text-gray-600" size={20} />
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <User size={18} className="text-gray-400" />
            </div>
          </div>
        </div>
        {/* Categories */}
        <div className="max-w-4xl mx-auto px-4 py-2 flex gap-4 overflow-x-auto no-scrollbar text-sm font-medium text-gray-500 whitespace-nowrap">
          <span className="text-blue-600 border-b-2 border-blue-600">Top Stories</span>
          <span>Politics</span>
          <span>Tech</span>
          <span>World</span>
          <span>Science</span>
          <span>Health</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {MOCK_NEWS.map((news) => (
            <article key={news.id} className="flex gap-4 border-b border-gray-100 pb-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  <TrendingUp size={10} />
                  {news.category}
                </div>
                <h2 className="text-lg font-bold leading-tight hover:text-blue-600 transition-colors cursor-pointer">
                  {news.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={12} /> {news.time}</span>
                  <Share2 size={12} />
                  <MoreHorizontal size={12} />
                </div>
              </div>
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                <img src={news.image} alt="" className="w-full h-full object-cover grayscale-[0.5]" />
              </div>
            </article>
          ))}
        </motion.div>
      </main>

      {/* Footer Hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-10 transition-opacity">
        <span className="text-[10px] text-gray-400">Triple tap to switch view</span>
      </div>
    </div>
  );
}
