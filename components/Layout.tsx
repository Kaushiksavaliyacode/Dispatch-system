
import React, { ReactNode, useRef, useState } from 'react';
import { LayoutDashboard, Box, LogOut, Download, Upload, Shield, User, Menu, X, Receipt } from 'lucide-react';
import { AppView, UserRole } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentView: AppView;
  setView: (view: AppView) => void;
  userRole: UserRole;
  onLogout: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, userRole, onLogout, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const NavTab = ({ view, label, icon: Icon }: { view: AppView, label: string, icon: React.ElementType }) => (
    <button
      onClick={() => {
        setView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 group overflow-hidden ${
        currentView === view 
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
          : 'text-slate-500 hover:bg-white hover:text-slate-800'
      }`}
    >
      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${currentView === view ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
      <span>{label}</span>
      {currentView === view && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Header - Glassmorphism */}
      <header className="h-18 bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-[1920px] mx-auto h-full px-4 md:px-6 lg:px-8 flex items-center justify-between py-3">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => userRole === 'admin' && setView(AppView.DASHBOARD)}>
             <div className="relative">
                 <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-xl"></div>
                 <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 relative">
                    <Box className="w-5 h-5 text-white" />
                 </div>
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">RDMS</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Production</p>
             </div>
          </div>

          {/* Center: Navigation (Admin Only) */}
          <div className="hidden md:flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
             {userRole === 'admin' && (
                 <>
                    <NavTab view={AppView.DASHBOARD} label="Overview" icon={LayoutDashboard} />
                 </>
             )}
          </div>

          {/* Right: Actions & Logout */}
          <div className="flex items-center gap-4">
             {userRole === 'admin' && (
                <div className="hidden lg:flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
                   <button 
                      onClick={onExport} 
                      title="Backup Data"
                      className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100 active:scale-95"
                   >
                      <Download className="w-5 h-5" />
                   </button>
                   <button 
                      onClick={triggerImport} 
                      title="Restore Data"
                      className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 active:scale-95"
                   >
                      <Upload className="w-5 h-5" />
                   </button>
                   <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
                </div>
             )}

             <div className="hidden sm:flex items-center gap-3 text-right pl-2">
                <div className={`p-2.5 rounded-xl border ${userRole === 'admin' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                   {userRole === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="leading-tight hidden md:block">
                   <div className="text-xs font-black text-slate-800 uppercase tracking-wide">{userRole === 'admin' ? 'Administrator' : 'Operator'}</div>
                   <div className="text-[10px] font-semibold text-slate-400">Logged In</div>
                </div>
             </div>

             <button 
                onClick={onLogout}
                className="hidden sm:flex items-center gap-2 bg-white text-slate-500 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
             >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
             </button>

             {/* Mobile Menu Toggle */}
             <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl active:bg-slate-200 transition-colors"
             >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-40 animate-in slide-in-from-right duration-300 flex flex-col">
           <div className="p-6 space-y-6 flex-1 overflow-auto">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className={`p-3 rounded-xl ${userRole === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {userRole === 'admin' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-900">{userRole === 'admin' ? 'Administrator' : 'Operator'}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Currently Active</div>
                  </div>
              </div>

              <div className="space-y-3">
                {userRole === 'admin' && (
                    <button onClick={() => { setView(AppView.DASHBOARD); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold shadow-sm active:scale-95 transition-transform">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><LayoutDashboard className="w-5 h-5" /></div>
                        Dashboard
                    </button>
                )}
                
                {userRole === 'admin' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button onClick={onExport} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-200 text-slate-600 font-bold bg-white active:bg-slate-50">
                            <Download className="w-6 h-6 text-emerald-500" /> 
                            <span>Backup</span>
                        </button>
                        <button onClick={triggerImport} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-200 text-slate-600 font-bold bg-white active:bg-slate-50">
                            <Upload className="w-6 h-6 text-blue-500" /> 
                            <span>Restore</span>
                        </button>
                    </div>
                )}
              </div>
           </div>

           <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-3 bg-white text-red-500 p-4 rounded-2xl font-bold border border-slate-200 shadow-sm active:scale-95 transition-all"
              >
                  <LogOut className="w-5 h-5" /> Logout System
              </button>
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative w-full">
         <div className="h-full overflow-y-auto scroll-smooth p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto relative z-10 no-scrollbar">
            {children}
         </div>
      </main>
    </div>
  );
};
