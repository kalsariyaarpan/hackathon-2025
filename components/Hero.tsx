
import React from 'react';
import { ArrowRight, HardDrive, ShieldAlert, Activity } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <div className="relative overflow-hidden bg-brand-50 min-h-[calc(100vh-64px)] flex items-center">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Prevent silent <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">
                digital file decay.
              </span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
              Your data is rotting. ai-guardian scans, analyzes, and predicts integrity issues in your digital archives before they are lost forever.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  onStart();
                }}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-xl text-lg font-semibold shadow-lg shadow-brand-500/30 hover:bg-brand-700 hover:shadow-brand-500/50 transition-all transform hover:-translate-y-1 z-20  w-[-webkit-fill-available]"
              >
                Scan Your Files <ArrowRight size={20} />
              </button>
              
            </div>
          </div>

          <div className="relative hidden lg:block pointer-events-none select-none">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 translate-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                  <div className="p-3 bg-red-50 text-red-500 rounded-full mb-3">
                    <ShieldAlert size={32} />
                  </div>
                  <h3 className="font-bold text-gray-800">Bit Rot Detection</h3>
                  <p className="text-sm text-gray-500 mt-1">Identifies flipped bits in older storage media.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-full mb-3">
                    <Activity size={32} />
                  </div>
                  <h3 className="font-bold text-gray-800">Format Aging</h3>
                  <p className="text-sm text-gray-500 mt-1">Warns about obsolete file formats (e.g., Flash, old DOC).</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center h-full justify-center">
                   <div className="radial-progress text-brand-600 text-2xl font-bold mb-2 relative w-24 h-24 flex items-center justify-center rounded-full border-8 border-brand-100">
                     <span className="absolute">98%</span>
                   </div>
                   <h3 className="font-bold text-gray-800">Health Score</h3>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
