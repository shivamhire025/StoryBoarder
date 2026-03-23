import React from 'react';
import { motion } from 'motion/react';
import { Loader2, RefreshCw, Type as TypeIcon, Image as ImageIcon, Sparkles, Bird, Sparkles as SparklesIcon } from 'lucide-react';
import { Page } from '../types';

interface PageCardProps {
  page: Page;
  onRegenerateImage: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
}

export const PageCard: React.FC<PageCardProps> = ({ page, onRegenerateImage, onUpdateText }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
    >
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        {page.imageUrl ? (
          <img
            src={page.imageUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-8 text-center relative">
            {page.isGeneratingImage ? (
              <>
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Sparkles className="w-32 h-32 text-amber-200/50" />
                </motion.div>
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-amber-500" />
                <p className="text-xs font-mono uppercase tracking-widest text-amber-600/60">Painting Scene...</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-mono uppercase tracking-widest">No Image Generated</p>
              </>
            )}
          </div>
        )}
        
        <button
          onClick={() => onRegenerateImage(page.id)}
          disabled={page.isGeneratingImage}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          title="Regenerate Image"
        >
          <RefreshCw className={`w-4 h-4 ${page.isGeneratingImage ? 'animate-spin' : ''}`} />
        </button>
        
        <div className="absolute bottom-4 left-4 bg-ink text-paper px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest">
          Page {page.pageNumber}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink/40">
            <TypeIcon className="w-3 h-3" />
            Story Text
            <motion.div
              animate={{ y: [0, -1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <Bird className="w-2 h-2 text-sky-400/60" />
            </motion.div>
          </label>
          <textarea
            value={page.text}
            onChange={(e) => onUpdateText(page.id, e.target.value)}
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-lg font-serif italic leading-relaxed resize-none min-h-[80px]"
            placeholder="Write the story for this page..."
          />
        </div>
        
        <div className="pt-4 border-t border-ink/5">
          <p className="text-[9px] font-mono text-ink/30 uppercase leading-tight flex items-center gap-1">
            <Sparkles className="w-2 h-2 text-amber-400/40" />
            <span className="font-bold">Prompt:</span> {page.imagePrompt}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
