
import React, { useState } from 'react';
import { validateUser, createUser, resetPassword, updateLastLogin } from '../db';

interface LoginProps {
  onLogin: (username: string) => void;
}

type Mode = 'login' | 'create' | 'forgot';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEmail('');
    setPhoneNumber('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    setTimeout(() => {
      if (mode === 'login') {
        const user = validateUser(username, password);
        if (user) {
          updateLastLogin(user.username);
          localStorage.setItem('spi_current_user', JSON.stringify({
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber || ''
          }));
          onLogin(user.username);
        } else {
          setError('Invalid credentials. Access denied.');
          setIsLoading(false);
        }
      } else if (mode === 'create') {
        if (!username || !email || !password || !phoneNumber) {
          setError('All fields are required.');
          setIsLoading(false);
          return;
        }
        if (createUser(username, password, email, phoneNumber)) {
          setSuccess('Account created successfully! You can now log in.');
          setMode('login');
          resetForm();
        } else {
          setError('Username or email already exists.');
        }
        setIsLoading(false);
      } else if (mode === 'forgot') {
        if (!email) {
          setError('Email is required.');
          setIsLoading(false);
          return;
        }
        if (resetPassword(email)) {
          setSuccess('Password reset! Check your email for the new password (reset123).');
          setMode('login');
          resetForm();
        } else {
          setError('Email not found.');
        }
        setIsLoading(false);
      }
    }, 800);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#020617] px-4 overflow-hidden relative">
      {/* Immersive background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[140px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[140px] rounded-full animate-pulse"></div>
      </div>
      
      <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.7)] p-12 border border-white/5 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center mb-12">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-1000"></div>
            <img 
              src="images/logo.png" 
              alt="SPi Logo" 
              className="w-48 h-48 mx-auto relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all duration-700"
              onError={(e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/2563/2563353.png' }}
            />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mt-8 italic uppercase">SPi <span className="text-indigo-500">Secure</span></h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></span>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Auth Protocol Active</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'login' && (
            <>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal ID</label>
                <div className="relative group">
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all group-hover:border-slate-700"
                    placeholder="Agent Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="off"
                  />
                  <svg className="w-5 h-5 absolute right-4 top-4 text-slate-700 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Token</label>
                <div className="relative group">
                  <input
                    type="password"
                    className="w-full bg-black/60 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all group-hover:border-slate-700"
                    placeholder="Encrypted Key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <svg className="w-5 h-5 absolute right-4 top-4 text-slate-700 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </>
          )}

          {mode === 'create' && (
            <>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative group">
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all group-hover:border-slate-700"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="off"
                  />
                  <svg className="w-5 h-5 absolute right-4 top-4 text-slate-700 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <input
                    type="email"
                    className="w-full bg-black/60 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all group-hover:border-slate-700"
                    placeholder="your.email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                  />
                  <svg className="w-5 h-5 absolute right-4 top-4 text-slate-700 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <input
                    type="password"
                    className="w-full bg-black/60 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all group-hover:border-slate-700"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <svg className="w-5 h-5 absolute right-4 top-4 text-slate-700 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <input
                    type="tel"
                    className="w-full bg-black/60 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all group-hover:border-slate-700"
                    placeholder="+91XXXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoComplete="off"
                  />
                  <svg className="w-5 h-5 absolute right-4 top-4 text-slate-700 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.129a11.042 11.042 0 005.516 5.516l1.129-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.95V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <input
                  type="email"
                  className="w-full bg-black/60 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all group-hover:border-slate-700"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
                <svg className="w-5 h-5 absolute right-4 top-4 text-slate-700 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 animate-in slide-in-from-top-2">
              <p className="text-red-400 text-xs font-bold text-center tracking-tight">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 animate-in slide-in-from-top-2">
              <p className="text-green-400 text-xs font-bold text-center tracking-tight">{success}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] active:scale-[0.98] mt-4 flex items-center justify-center group ${isLoading ? 'opacity-80' : ''}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="uppercase tracking-widest text-xs font-black">
                {mode === 'login' ? 'Authorize Terminal Access' : mode === 'create' ? 'Create Account' : 'Reset Password'}
              </span>
            )}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/20 opacity-40 group-hover:animate-shine"></div>
          </button>
        </form>

        <div className="mt-6 flex justify-center space-x-4">
          {mode !== 'login' && (
            <button
              onClick={() => switchMode('login')}
              className="text-slate-500 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Back to Login
            </button>
          )}
          {mode === 'login' && (
            <>
              <button
                onClick={() => switchMode('create')}
                className="text-slate-500 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={() => switchMode('forgot')}
                className="text-slate-500 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Forgot Password
              </button>
            </>
          )}
        </div>
        
        <div className="mt-12 pt-6 border-t border-slate-800/50 flex justify-between items-center opacity-40 group hover:opacity-100 transition-opacity">
           <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">Hardware ID: SPi-8842-X</span>
           <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">Node: 01-Epsilon</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
