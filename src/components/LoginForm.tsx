import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Loader2, Rabbit, Sparkles } from 'lucide-react';
import { loginWithEmail } from '../firebase';

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginWithEmail(email, password);
      onSuccess();
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please use the shared test credentials.");
      } else {
        setError("An error occurred during login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-paper relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-200 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-rose-200 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-ink/5 rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Rabbit className="w-10 h-10 text-indigo-500 animate-rainbow" />
          </div>
          <h1 className="text-3xl font-serif italic text-ink flex items-center gap-2">
            Storyweaver
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-ink/40 mt-2">Access the Studio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-ink/40 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full bg-ink/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/20 transition-all text-ink placeholder:text-ink/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-ink/40 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-ink/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/20 transition-all text-ink placeholder:text-ink/20"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs text-red-500 bg-red-50 p-4 rounded-xl border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper py-4 rounded-2xl font-mono uppercase tracking-widest hover:bg-ink/90 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter Studio"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-ink/5 text-center">
          <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wider">
            Please use the shared test credentials to log in.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
