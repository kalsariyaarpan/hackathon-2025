
import React from 'react';
import { View } from '../types';
import { ShieldCheck, LayoutDashboard, UploadCloud, Home, LogOut, User } from 'lucide-react';

interface NavbarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  session: any;
  onLogin: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, session, onLogin, onLogout }) => {
  const navItemClass = (view: View) =>
    `flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
      currentView === view
        ? 'bg-brand-600 text-white shadow-lg'
        : 'text-gray-600 hover:bg-gray-100 hover:text-brand-600'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setCurrentView(View.HOME)}
          >
            <ShieldCheck className="h-8 w-8 text-brand-600" />
            <span className="font-bold text-xl tracking-tight text-gray-900">ai-guardian</span>
          </div>
          
          <div className="hidden md:flex space-x-2">
            <button onClick={() => setCurrentView(View.HOME)} className={navItemClass(View.HOME)}>
              <Home size={18} /> Home
            </button>
            <button onClick={() => setCurrentView(View.UPLOAD)} className={navItemClass(View.UPLOAD)}>
              <UploadCloud size={18} /> Upload
            </button>
            <button 
              onClick={() => {
                if (!session) {
                  // Optional: You could trigger a toast here saying "Login required"
                  // But for now we let App.tsx handle the redirect view
                }
                setCurrentView(View.DASHBOARD)
              }} 
              className={navItemClass(View.DASHBOARD)}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
          </div>

          <div className="flex items-center gap-4">
             {session ? (
               <div className="flex items-center gap-3">
                 <span className="hidden sm:flex items-center gap-1 text-sm text-gray-600">
                   <User size={14} />
                   <span id="userEmail" className="truncate max-w-[150px]">{session.user.email}</span>
                 </span>
                 <button 
                   id="logoutBtn"
                   onClick={onLogout}
                   className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200"
                 >
                   <LogOut size={16} /> Logout
                 </button>
               </div>
             ) : (
               <button 
                 id="loginBtn"
                 onClick={onLogin}
                 className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center gap-2"
               >
                 Login
               </button>
             )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className="md:hidden flex justify-around py-3 border-t border-gray-100 bg-white/95 backdrop-blur-md shadow-inner">
         <button onClick={() => setCurrentView(View.HOME)} className={`flex flex-col items-center p-2 ${currentView === View.HOME ? "text-brand-600" : "text-gray-500"}`}>
            <Home size={20} />
            <span className="text-[10px] mt-1 font-medium">Home</span>
         </button>
         <button onClick={() => setCurrentView(View.UPLOAD)} className={`flex flex-col items-center p-2 ${currentView === View.UPLOAD ? "text-brand-600" : "text-gray-500"}`}>
            <UploadCloud size={20} />
            <span className="text-[10px] mt-1 font-medium">Upload</span>
         </button>
         <button onClick={() => setCurrentView(View.DASHBOARD)} className={`flex flex-col items-center p-2 ${currentView === View.DASHBOARD ? "text-brand-600" : "text-gray-500"}`}>
            <LayoutDashboard size={20} />
            <span className="text-[10px] mt-1 font-medium">Dashboard</span>
         </button>
      </div>
    </nav>
  );
};

export default Navbar;
