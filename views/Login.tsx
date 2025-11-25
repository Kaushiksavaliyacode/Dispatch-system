import React, { useState } from 'react';
import { Shield, User, Lock, ArrowRight, Box } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
      let isValid = false;

      // Validate credentials based on selected role
      if (selectedRole === 'admin') {
        if (username === 'Admin' && password === 'Admin.123') {
          isValid = true;
        }
      } else if (selectedRole === 'user') {
        if (username === 'User' && password === 'User.123') {
          isValid = true;
        }
      }

      if (isValid) {
        onLogin(selectedRole);
      } else {
        setError('Invalid ID or Password');
        setIsLoading(false);
      }
    }, 800);
  };

  const RoleCard = ({ 
    id, 
    icon: Icon, 
    label 
  }: { 
    id: UserRole, 
    icon: React.ElementType, 
    label: string 
  }) => (
    <button
      type="button"
      onClick={() => {
        setSelectedRole(id);
        setError(''); // Clear error when switching roles
        setUsername(''); // Optional: clear inputs
        setPassword('');
      }}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 w-full aspect-square ${
        selectedRole === id
          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-105 ring-4 ring-indigo-500/10'
          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
      }`}
    >
      <Icon className={`w-8 h-8 mb-3 ${selectedRole === id ? 'text-indigo-600' : 'text-slate-400'}`} />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 font-inter overflow-hidden relative">
      
      {/* Background Elements - Light Theme */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-200/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-blue-200/30 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in duration-500">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white/50 p-8 md:p-10">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-slate-900/20 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Box className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 text-center tracking-tight">RDMS</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Reliance Dispatch Management</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <RoleCard id="admin" icon={Shield} label="Admin" />
            <RoleCard id="user" icon={User} label="User" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Login ID</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter ID"
                  className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 text-sm font-semibold rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 text-sm font-semibold rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg text-center animate-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center group"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Access System
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
               Secure Production Management
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};