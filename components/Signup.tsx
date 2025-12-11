import React, { useState } from 'react';
import { Mail, Lock, UserPlus, Loader2, ArrowLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SignupProps {
  onNavigateLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onNavigateLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Added 'warning' to the type definition
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' | 'warning' } | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setMessage(null);

    // Basic validation
    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setMessage({ text: 'Please enter a valid email address.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      // Use current window location for redirect to ensure links work in all environments
      const currentUrl = window.location.origin;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: currentUrl,
        }
      });

      if (error) throw error;

      // Check if session is null (means email confirmation is required)
      if (data.user && !data.session) {
         setMessage({ 
          text: 'Registration successful! 📧 Please check your email to confirm your account before logging in.', 
          type: 'success' 
        });
      } else {
        setMessage({ 
          text: 'Signup successful! Logging you in...', 
          type: 'success' 
        });
        setTimeout(() => {
          onNavigateLogin();
        }, 2000);
      }

    } catch (error: any) {
      const msg = (error.message || '').toLowerCase();
      console.warn("Signup Error Detail:", error);

      // 1. Rate Limit Error
      if (msg.includes('rate limit') || msg.includes('too many requests') || error.status === 429) {
        setMessage({ 
          text: 'Security Limit: Too many signup attempts. Please wait 1 hour before trying again or check your inbox for an existing email.', 
          type: 'warning' 
        });
      } 
      // 2. SMTP / Email Sending Error (The specific issue reported)
      else if (msg.includes('error sending confirmation email') || msg.includes('error sending email')) {
        setMessage({ 
          text: 'Service Limit Reached: Unable to send verification email. The daily email limit for this project may have been exceeded. Please try again later.', 
          type: 'error' 
        });
      }
      // 3. User Already Exists
      else if (msg.includes('already registered') || msg.includes('unique constraint')) {
        setMessage({ 
          text: 'This email is already registered. Please log in instead.', 
          type: 'warning' 
        });
      }
      // 4. General Error
      else {
        setMessage({ text: error.message || 'Signup failed. Please try again.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine style based on message type
  const getMessageStyles = (type: 'error' | 'success' | 'warning') => {
    switch (type) {
      case 'success': return 'bg-green-50 text-green-700 border border-green-200';
      case 'warning': return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      case 'error': return 'bg-red-50 text-red-600 border border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getMessageIcon = (type: 'error' | 'success' | 'warning') => {
    switch (type) {
      case 'success': return <CheckCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'error': return <XCircle size={16} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden bg-brand-50 py-12">
      
      {/* Background Blobs */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="flex flex-col items-center gap-6 w-full max-w-md m-4">
        
        {/* Glass Card */}
        <div className="relative z-10 w-full p-8 rounded-2xl border border-white/40 shadow-xl bg-white/60 backdrop-blur-xl transition-all">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 mb-4 border border-brand-200 shadow-sm">
              <UserPlus size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
            <p className="text-gray-600 mt-2 text-sm">Join ai-guardian to protect your data.</p>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-lg text-sm flex items-start gap-3 ${getMessageStyles(message.type)}`}>
               <div className="shrink-0 mt-0.5">
                 {message.type && getMessageIcon(message.type)}
                 {loading && !message.type && <Loader2 size={16} className="animate-spin" />}
               </div>
               <span>{message.text}</span>
            </div>
          )}

          {!message?.type || message.type === 'error' || message.type === 'warning' ? (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    id="signupEmail"
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
                    id="signupPassword"
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all hover:bg-gray-50/50"
                    placeholder="Create a password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 transform transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Sign Up
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm mb-6">Once you have verified your email, click the button below to log in.</p>
              <button 
                onClick={onNavigateLogin}
                className="w-full py-3 px-4 bg-white border border-brand-200 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition-colors"
              >
                Proceed to Login
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <button 
              onClick={onNavigateLogin}
              className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
            >
              <ArrowLeft size={16} /> Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;