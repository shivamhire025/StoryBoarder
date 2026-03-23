import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, BookOpen, User, ShieldCheck, ShieldAlert, PenTool, Palette, Upload, X, Image as ImageIcon, Rabbit, Sparkles as SparklesIcon, Cloud, Trees, Ghost, Bird, Star } from 'lucide-react';

interface StoryFormProps {
  onSubmit: (
    theme: string, 
    character: string, 
    narrative: string, 
    isConsistent: boolean, 
    isStyleConsistent: boolean, 
    pageCount: number,
    characterImage?: { data: string; mimeType: string },
    themeImage?: { data: string; mimeType: string }
  ) => void;
  isLoading: boolean;
}

export const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, isLoading }) => {
  const [theme, setTheme] = useState('');
  const [character, setCharacter] = useState('');
  const [narrative, setNarrative] = useState('');
  const [isConsistent, setIsConsistent] = useState(true);
  const [isStyleConsistent, setIsStyleConsistent] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [characterImage, setCharacterImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [themeImage, setThemeImage] = useState<{ data: string; mimeType: string } | null>(null);
  const charFileInputRef = useRef<HTMLInputElement>(null);
  const themeFileInputRef = useRef<HTMLInputElement>(null);

  const handleCharImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCharacterImage({
          data: reader.result as string,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThemeImage({
          data: reader.result as string,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((theme || themeImage) && (character || characterImage)) {
      onSubmit(theme, character, narrative, isConsistent, isStyleConsistent, pageCount, characterImage || undefined, themeImage || undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-8 py-12 relative">
      <div className="text-center space-y-4 relative">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-50/50 backdrop-blur-md border border-indigo-100 shadow-sm rounded-2xl mb-2 overflow-hidden">
          <Rabbit className="w-8 h-8 animate-rainbow" />
        </div>
        <h2 className="text-4xl font-serif italic flex items-center justify-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <SparklesIcon className="w-6 h-6 text-amber-400/40" />
          </motion.div>
          Begin Your Tale
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          >
            <SparklesIcon className="w-6 h-6 text-amber-400/40" />
          </motion.div>
        </h2>
        <p className="text-ink/60 max-w-sm mx-auto">
          Describe the world, the hero, and the journey they will take.
        </p>
      </div>

      <div className="space-y-6 bg-white/40 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl shadow-ink/5">
        <div className="space-y-2 relative">
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink/70">
            <BookOpen className="w-3 h-3" />
            The Theme or Setting
            <motion.div
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block"
            >
              <Cloud className="w-3 h-3 text-sky-400" />
            </motion.div>
          </label>
          
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:block opacity-30">
            <Trees className="w-12 h-12 text-emerald-300" />
          </div>
          
          <div className="space-y-4">
            {!themeImage ? (
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., A magical forest where the trees whisper secrets"
                  className="w-full bg-white border border-ink/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ink/5 focus:border-ink/20 outline-none transition-all"
                  required={!themeImage}
                />
                
                <div 
                  onClick={() => themeFileInputRef.current?.click()}
                  className="border-2 border-dashed border-ink/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-ink/5 transition-colors group"
                >
                  <Upload className="w-5 h-5 text-ink/20 group-hover:text-ink/40 transition-colors" />
                  <p className="text-[10px] text-ink/40 font-mono uppercase tracking-widest">Or upload a reference photo</p>
                  <input 
                    type="file" 
                    ref={themeFileInputRef}
                    onChange={handleThemeImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative group aspect-video rounded-xl overflow-hidden border border-ink/10 bg-white">
                <img 
                  src={themeImage.data} 
                  alt="Theme reference" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={() => setThemeImage(null)}
                    className="bg-paper text-ink p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-paper/80 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-mono uppercase tracking-widest text-ink/60">
                  Theme Reference Loaded
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 relative">
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink/70">
            <User className="w-3 h-3" />
            The Main Character
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-block"
            >
              <Ghost className="w-3 h-3 text-indigo-300" />
            </motion.div>
          </label>
          
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:block opacity-30">
            <Rabbit className="w-12 h-12 text-rose-300" />
          </div>
          
          <div className="space-y-4">
            {!characterImage ? (
              <div className="grid grid-cols-1 gap-4">
                <textarea
                  value={character}
                  onChange={(e) => setCharacter(e.target.value)}
                  placeholder="Describe your character (e.g., A small brave rabbit named Pip...)"
                  className="w-full bg-white border border-ink/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ink/5 focus:border-ink/20 outline-none transition-all min-h-[80px]"
                  required={!characterImage}
                />
                
                <div 
                  onClick={() => charFileInputRef.current?.click()}
                  className="border-2 border-dashed border-ink/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-ink/5 transition-colors group"
                >
                  <Upload className="w-5 h-5 text-ink/20 group-hover:text-ink/40 transition-colors" />
                  <p className="text-[10px] text-ink/40 font-mono uppercase tracking-widest">Or upload a photo/drawing</p>
                  <input 
                    type="file" 
                    ref={charFileInputRef}
                    onChange={handleCharImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative group aspect-video rounded-xl overflow-hidden border border-ink/10 bg-white">
                <img 
                  src={characterImage.data} 
                  alt="Character reference" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={() => setCharacterImage(null)}
                    className="bg-paper text-ink p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-paper/80 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-mono uppercase tracking-widest text-ink/60">
                  Character Reference Loaded
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 relative">
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink/70">
            <PenTool className="w-3 h-3" />
            Story Narrative / Plot (Optional)
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <Bird className="w-3 h-3 text-amber-400" />
            </motion.div>
          </label>
          
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:block opacity-30">
            <Ghost className="w-12 h-12 text-indigo-300" />
          </div>
          
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="e.g., Pip finds a lost star and must return it to the sky before dawn..."
            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ink/5 focus:border-ink/20 outline-none transition-all min-h-[100px]"
          />
        </div>

        <div className="space-y-4 relative">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink/70">
              <SparklesIcon className="w-3 h-3" />
              Initial Storyboards
              <span className="text-indigo-500 font-bold ml-2">
                {pageCount === 6 ? 'Full Story (6)' : pageCount}
              </span>
            </label>
            <span className="text-[8px] font-mono text-ink/40 uppercase tracking-widest">
              Manage Usage Limits
            </span>
          </div>
          
          <div className="px-2">
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={pageCount}
              onChange={(e) => setPageCount(parseInt(e.target.value))}
              className="w-full h-2 bg-ink/5 rounded-lg appearance-none cursor-pointer accent-ink"
            />
            <div className="flex justify-between mt-2 text-[8px] font-mono text-ink/30 uppercase tracking-widest">
              <span>1 Page</span>
              <span>3 Pages</span>
              <span>Full Story (6)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:block opacity-30">
            <Star className="w-12 h-12 text-yellow-300" />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white border border-ink/10 rounded-xl">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink/70">
                {isConsistent ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                Character Consistency
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="inline-block"
                >
                  <Rabbit className="w-3 h-3 text-rose-300" />
                </motion.div>
              </label>
              <p className="text-[10px] text-ink/60">Keep hero features same</p>
            </div>
            <button
              type="button"
              onClick={() => setIsConsistent(!isConsistent)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                isConsistent ? 'bg-ink' : 'bg-ink/10'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  isConsistent ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-ink/10 rounded-xl">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink/70">
                <Palette className="w-3 h-3" />
                Art Style Consistency
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="inline-block"
                >
                  <Trees className="w-3 h-3 text-emerald-300" />
                </motion.div>
              </label>
              <p className="text-[10px] text-ink/60">Maintain visual theme</p>
            </div>
            <button
              type="button"
              onClick={() => setIsStyleConsistent(!isStyleConsistent)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                isStyleConsistent ? 'bg-ink' : 'bg-ink/10'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  isStyleConsistent ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || (!theme && !themeImage) || (!character && !characterImage)}
          className="w-full bg-ink text-paper py-4 rounded-xl font-mono uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-ink/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 animate-pulse" />
              Weaving Story...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              Generate Storyboard
              <Sparkles className="w-4 h-4 text-amber-400" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
