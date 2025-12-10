
import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onNavigateHome: () => void;
  onNavigateSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateHome, onNavigateSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanEmail = email.trim();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;
      // Navigation is handled by App.tsx session listener
    } catch (error: any) {
      let errorMsg = error.message || 'Login failed';
      
      // Friendly message for unconfirmed emails
      if (errorMsg.includes('Email not confirmed')) {
        errorMsg = 'Email not confirmed. Please check your inbox for the verification link.';
      }
      
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden bg-brand-50 py-12">
      
      {/* Abstract Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="flex flex-col items-center gap-6 w-full max-w-md m-4">

        {/* Glass Card */}
        <div className="relative z-10 w-full p-8 rounded-2xl border border-white/40 shadow-xl bg-white/60 backdrop-blur-xl transition-all">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 mb-4 border border-brand-200 shadow-sm">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
            <p className="text-gray-600 mt-2 text-sm">Sign in to access your digital guardian.</p>
          </div>

          {/* Status Messages */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
              <span>{message.text}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  id="emailInput"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all hover:bg-gray-50/50"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  id="passwordInput"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all hover:bg-gray-50/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 transform transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Login
            </button>
          </form>

          <div className="my-6 flex items-center justify-center">
            <div className="h-px bg-gray-200 w-full"></div>
            <span className="px-4 text-sm text-gray-500 bg-transparent">or</span>
            <div className="h-px bg-gray-200 w-full"></div>
          </div>

          {/* Go to Signup */}
          <button
            onClick={onNavigateSignup}
            className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-brand-600 font-medium flex items-center justify-center gap-2 transition-all hover:shadow-md hover:border-brand-200 group"
          >
            Create an Account <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>

          {/* Back to Home */}
          <div className="mt-8 text-center">
              <button onClick={onNavigateHome} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  &larr; Back to Home
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
