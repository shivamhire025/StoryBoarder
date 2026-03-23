/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { Plus, Download, ArrowLeft, AlertCircle, Loader2, Star, Cloud, Ghost, Rabbit, Trees, Sparkles as SparklesIcon, Bird, Fish, LogIn, LogOut, Library, Save, Check } from 'lucide-react';
import { Story, Page } from './types';
import { generateStoryOutline, generatePageImage, describeCharacterFromImage, describeThemeFromImage } from './services/geminiService';
import { StoryForm } from './components/StoryForm';
import { PageCard } from './components/PageCard';
import { DraftsLibrary } from './components/DraftsLibrary';
import { LoginForm } from './components/LoginForm';
import { auth, logout, db, collection, doc, setDoc, Timestamp, onAuthStateChanged, User } from './firebase';
import jsPDF from 'jspdf';

export default function App() {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX - 16);
      mouseY.set(e.clientY - 16);
    };
    window.addEventListener('mousemove', moveMouse);
    return () => window.removeEventListener('mousemove', moveMouse);
  }, []);

  const handleCreateStory = async (
    theme: string, 
    character: string, 
    narrative: string, 
    isConsistent: boolean, 
    isStyleConsistent: boolean, 
    pageCount: number,
    title?: string,
    characterImage?: { data: string; mimeType: string },
    themeImage?: { data: string; mimeType: string }
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      let finalCharacterDescription = character;
      let finalThemeDescription = theme;
      
      const tasks = [];
      
      if (characterImage) {
        tasks.push(describeCharacterFromImage(characterImage.data, characterImage.mimeType).then(desc => {
          finalCharacterDescription = desc;
        }));
      }
      
      if (themeImage) {
        tasks.push(describeThemeFromImage(themeImage.data, themeImage.mimeType).then(desc => {
          finalThemeDescription = desc;
        }));
      }

      if (tasks.length > 0) {
        await Promise.all(tasks);
      }

      const outline = await generateStoryOutline(finalThemeDescription, finalCharacterDescription, narrative, isConsistent, isStyleConsistent, pageCount, title);
      const newPages: Page[] = outline.pages.map((p, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        pageNumber: i + 1,
        text: p.text,
        imagePrompt: p.imagePrompt,
        isGeneratingImage: true,
      }));

      setStory({
        userId: user?.uid || 'anonymous',
        title: outline.title,
        theme: finalThemeDescription,
        characterDescription: finalCharacterDescription,
        pages: newPages,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Generate images sequentially to avoid rate limits and for better UX
      let firstPageImageUrl: string | undefined = undefined;

      for (const page of newPages) {
        try {
          // Add a small delay between requests to avoid hitting rate limits
          if (page.pageNumber > 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          // Use the first page's image as a reference for all subsequent pages to maintain consistency
          const referenceImage = firstPageImageUrl ? { data: firstPageImageUrl, mimeType: 'image/png' } : undefined;
          const imageUrl = await generatePageImage(page.imagePrompt, referenceImage);
          
          if (page.pageNumber === 1 && imageUrl) {
            firstPageImageUrl = imageUrl;
          }

          setStory(prev => {
            if (!prev) return null;
            return {
              ...prev,
              pages: prev.pages.map(p => 
                p.id === page.id ? { ...p, imageUrl, isGeneratingImage: false } : p
              )
            };
          });
        } catch (imgErr: any) {
          console.error("Error generating image:", imgErr);
          setStory(prev => {
            if (!prev) return null;
            const updated = {
              ...prev,
              pages: prev.pages.map(p => 
                p.id === page.id ? { ...p, isGeneratingImage: false } : p
              )
            };
            // Auto-save the draft if user is logged in
            if (user) {
              const storyId = updated.id || Math.random().toString(36).substr(2, 9);
              const storyRef = doc(db, 'users', user.uid, 'stories', storyId);
              setDoc(storyRef, {
                ...updated,
                id: storyId,
                userId: user.uid,
                updatedAt: Timestamp.now(),
                createdAt: updated.createdAt instanceof Date ? Timestamp.fromDate(updated.createdAt) : updated.createdAt || Timestamp.now(),
              }).catch(e => console.error("Auto-save failed:", e));
            }
            return updated;
          });
        }
      }
    } catch (err: any) {
      console.error("Error generating story:", err);
      const errorMessage = err?.message || "";
      if (errorMessage.includes("limit: 0")) {
        setError(errorMessage);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!story) return;
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Cover Page
      pdf.setFont('serif', 'italic');
      pdf.setFontSize(40);
      pdf.text(story.title, pageWidth / 2, 140, { align: 'center' });
      
      // Story Pages
      for (let i = 0; i < story.pages.length; i++) {
        const page = story.pages[i];
        pdf.addPage();
        
        // Image
        if (page.imageUrl) {
          pdf.addImage(page.imageUrl, 'PNG', 20, 20, pageWidth - 40, pageWidth - 40);
        } else {
          pdf.setDrawColor(200);
          pdf.rect(20, 20, pageWidth - 40, pageWidth - 40);
          pdf.setFontSize(12);
          pdf.text("Image not generated", pageWidth / 2, (pageWidth - 40) / 2 + 20, { align: 'center' });
        }
        
        // Text
        pdf.setFont('serif', 'italic');
        pdf.setFontSize(18);
        pdf.setTextColor(26);
        const splitText = pdf.splitTextToSize(page.text, pageWidth - 60);
        pdf.text(splitText, pageWidth / 2, pageWidth + 10, { align: 'center' });
        
        // Page Number
        pdf.setFont('mono', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(`Page ${page.pageNumber}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
      }
      
      pdf.save(`${story.title.replace(/\s+/g, '_')}_Storybook.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegenerateImage = async (id: string) => {
    setStory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pages: prev.pages.map(p => p.id === id ? { ...p, isGeneratingImage: true } : p)
      };
    });

    const page = story?.pages.find(p => p.id === id);
    if (page) {
      try {
        // Use the first page's image as a reference if available
        const firstPage = story?.pages.find(p => p.pageNumber === 1);
        const referenceImage = (firstPage?.imageUrl && firstPage.id !== id) 
          ? { data: firstPage.imageUrl, mimeType: 'image/png' } 
          : undefined;

        const imageUrl = await generatePageImage(page.imagePrompt, referenceImage);
        setStory(prev => {
          if (!prev) return null;
          return {
            ...prev,
            pages: prev.pages.map(p => 
              p.id === id ? { ...p, imageUrl, isGeneratingImage: false } : p
            )
          };
        });
      } catch (err) {
        console.error("Error regenerating image:", err);
      }
    }
  };

  const handleUpdateText = (id: string, text: string) => {
    setStory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pages: prev.pages.map(p => p.id === id ? { ...p, text } : p)
      };
    });
  };

  const handleSaveStory = async () => {
    if (!story || !user) {
      return;
    }
    
    setIsSaving(true);
    try {
      const storyId = story.id || Math.random().toString(36).substr(2, 9);
      const storyRef = doc(db, 'users', user.uid, 'stories', storyId);
      
      const storyToSave = {
        ...story,
        id: storyId,
        userId: user.uid,
        updatedAt: Timestamp.now(),
        createdAt: story.createdAt instanceof Date ? Timestamp.fromDate(story.createdAt) : story.createdAt || Timestamp.now(),
      };

      await setDoc(storyRef, storyToSave);
      setStory(prev => prev ? { ...prev, id: storyId } : null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving story:", err);
      setError("Failed to save story. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadStory = (loadedStory: Story) => {
    setStory(loadedStory);
    setShowLibrary(false);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-paper">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        {/* Subtle colorful blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100/30 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-rose-100/20 rounded-full blur-[100px]" />
        
        <div className="opacity-[0.1]">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[5%]"
        >
          <Cloud className="w-32 h-32 text-sky-200" />
        </motion.div>
        
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] right-[10%]"
        >
          <Star className="w-24 h-24 text-yellow-200" />
        </motion.div>

        <motion.div 
          animate={{ 
            x: [0, 30, 0],
            rotate: [0, 15, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[15%] left-[15%]"
        >
          <Rabbit className="w-40 h-40 text-rose-200" />
        </motion.div>

        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[20%]"
        >
          <Trees className="w-48 h-48 text-emerald-200" />
        </motion.div>

        <motion.div 
          animate={{ 
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[50%]"
        >
          <SparklesIcon className="w-16 h-16 text-yellow-200" />
        </motion.div>

        <motion.div 
          animate={{ 
            y: [0, -40, 0],
            x: [0, 20, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[60%] right-[5%]"
        >
          <Ghost className="w-28 h-28 text-indigo-200" />
        </motion.div>

        <motion.div 
          animate={{ 
            x: [-20, 20, -20],
            y: [0, -10, 0]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] right-[30%]"
        >
          <Bird className="w-20 h-20 text-amber-200" />
        </motion.div>

        <motion.div 
          animate={{ 
            x: [0, 40, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[5%] left-[40%]"
        >
          <Fish className="w-24 h-24 text-cyan-200" />
        </motion.div>
      </div>
    </div>

    {/* Mouse Follower */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[100] hidden lg:block"
        style={{
          x: cursorX,
          y: cursorY,
        }}
      >
        <SparklesIcon className="w-full h-full text-amber-400/40 animate-pulse" />
      </motion.div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-ink/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setStory(null)}>
            <div className="w-10 h-10 bg-indigo-50/50 backdrop-blur-md border border-indigo-100 shadow-sm rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform overflow-hidden">
              <Rabbit className="w-6 h-6 animate-rainbow" />
            </div>
            <div>
              <h1 className="text-xl font-serif italic leading-none flex items-center gap-1">
                Storyweaver
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <SparklesIcon className="w-3 h-3 text-amber-400" />
                </motion.div>
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40">Storyboard Studio</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthReady && user && (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowLibrary(true)}
                  className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                  <Library className="w-3 h-3" />
                  Library
                </button>
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            )}

            {story && (
              <div className="flex items-center gap-4 border-l border-ink/10 pl-4">
                <button
                  onClick={() => setStory(null)}
                  className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest hover:text-ink/60 transition-colors"
                  disabled={isExporting}
                >
                  <ArrowLeft className="w-3 h-3" />
                  New Story
                </button>
                
                <button
                  onClick={handleSaveStory}
                  disabled={isSaving || !user}
                  className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-all ${saveSuccess ? 'text-green-600' : 'hover:text-indigo-600'} disabled:opacity-30`}
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Draft'}
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="bg-ink text-paper px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest hover:bg-ink/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  {isExporting ? 'Exporting...' : 'Download PDF'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showLibrary && (
          <DraftsLibrary 
            onLoadStory={handleLoadStory} 
            onClose={() => setShowLibrary(false)} 
          />
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {!story ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {error && (
                <div className="max-w-xl mx-auto mb-8 flex items-center gap-2 justify-center text-red-600 bg-red-50 p-4 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <StoryForm onSubmit={handleCreateStory} isLoading={isLoading} />
            </motion.div>
          ) : (
            <motion.div
              key="storyboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-serif italic">{story.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {story.pages.map((page) => (
                  <PageCard
                    key={page.id}
                    page={page}
                    onRegenerateImage={handleRegenerateImage}
                    onUpdateText={handleUpdateText}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button for New Page (Optional) */}
      {story && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 right-8"
        >
          <button className="w-14 h-14 bg-ink text-paper rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
            <Plus className="w-6 h-6" />
          </button>
        </motion.div>
      )}
      {/* Footer */}
      {!story && (
        <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-ink/5 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 opacity-20">
            <Rabbit className="w-8 h-8" />
            <Bird className="w-8 h-8" />
            <Fish className="w-8 h-8" />
            <Ghost className="w-8 h-8" />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink/30">
            Crafted with Magic & AI
          </p>
        </footer>
      )}
    </div>
  );
}
