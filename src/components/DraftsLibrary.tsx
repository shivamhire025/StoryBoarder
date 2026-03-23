import React, { useEffect, useState } from 'react';
import { db, auth, collection, query, where, orderBy, onSnapshot, deleteDoc, doc, Timestamp } from '../firebase';
import { Story } from '../types';
import { BookOpenIcon, TrashIcon, ClockIcon, ArrowRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DraftsLibraryProps {
  onLoadStory: (story: Story) => void;
  onClose: () => void;
}

export const DraftsLibrary: React.FC<DraftsLibraryProps> = ({ onLoadStory, onClose }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'stories'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storyList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      setStories(storyList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stories:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    if (!auth.currentUser || !storyId) return;
    
    if (window.confirm("Are you sure you want to delete this draft?")) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'stories', storyId));
      } catch (error) {
        console.error("Error deleting story:", error);
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-bg w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-ink/10"
      >
        <div className="p-6 border-bottom border-ink/5 flex justify-between items-center bg-white/50">
          <div>
            <h2 className="text-2xl font-serif italic text-ink">Your Drafts Library</h2>
            <p className="text-xs font-mono text-ink/40 uppercase tracking-widest mt-1">
              {stories.length} Saved Stories
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-ink/5 rounded-full transition-colors"
          >
            <ArrowRightIcon className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div>
            </div>
          ) : stories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-ink/30">
              <BookOpenIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-serif italic text-xl">No drafts saved yet</p>
              <p className="text-sm mt-2">Generate a story and save it to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {stories.map((story) => (
                  <motion.div
                    key={story.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onLoadStory(story)}
                    className="group bg-white border border-ink/5 rounded-2xl p-5 cursor-pointer hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleDelete(e, story.id!)}
                        className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        {story.pages[0]?.imageUrl ? (
                          <img 
                            src={story.pages[0].imageUrl} 
                            alt="" 
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <BookOpenIcon className="w-8 h-8 text-indigo-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg text-ink truncate group-hover:text-indigo-600 transition-colors">
                          {story.title || "Untitled Story"}
                        </h3>
                        <p className="text-xs text-ink/40 truncate mt-1">
                          {story.theme}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-ink/30 uppercase tracking-wider">
                          <ClockIcon className="w-3 h-3" />
                          {formatDate(story.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
