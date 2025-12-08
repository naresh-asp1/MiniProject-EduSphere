
import React, { useState } from 'react';
import { User, Role, Student, StaffProfile, ParentProfile, DEFAULT_CREDS } from '../types';
import { UserCheck, Shield, GraduationCap, BookOpen, X, User as UserIcon, Lock, CheckCircle, Mail, ExternalLink, Briefcase, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  students: Student[];
  staffList: StaffProfile[];
  parentList: ParentProfile[];
}

export const Auth: React.FC<AuthProps> = ({ onLogin, students, staffList, parentList }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resetUserName, setResetUserName] = useState('User');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Login Logic
      if (role === Role.ADMIN1) {
        if (username === DEFAULT_CREDS.ADMIN1.user && password === DEFAULT_CREDS.ADMIN1.pass) {
          onLogin({ id: 'admin1', username, name: 'Master Admin', role });
        } else {
          setError('Invalid Admin I credentials.');
        }
      } else if (role === Role.ADMIN2) {
        if (username === DEFAULT_CREDS.ADMIN2.user && password === DEFAULT_CREDS.ADMIN2.pass) {
          onLogin({ id: 'admin2', username, name: 'Verifier Admin', role });
        } else {
          setError('Invalid Admin II credentials.');
        }
      } else if (role === Role.HOD) {
        const staff = staffList.find(s => s.email === username);
        if (staff && password === DEFAULT_CREDS.STAFF_PASS) {
             if (staff.isHod) {
                 onLogin({ 
                    id: staff.id, 
                    username, 
                    name: staff.name, 
                    role: Role.HOD, 
                    department: staff.department, 
                    isHod: true 
                 });
             } else {
                 setError('Access Denied. You do not have Head of Department privileges.');
             }
        } else {
             setError('Invalid HOD email or password.');
        }
      } else if (role === Role.STAFF) {
        const staff = staffList.find(s => s.email === username);
        if (staff && password === DEFAULT_CREDS.STAFF_PASS) {
          // If the user is actually an HOD but clicked Staff, we still log them in with their correct role privileges
          const finalRole = staff.isHod ? Role.HOD : Role.STAFF;
          onLogin({ 
              id: staff.id, 
              username, 
              name: staff.name, 
              role: finalRole, 
              department: staff.department, 
              isHod: staff.isHod 
          });
        } else {
          setError('Invalid Staff email or password.');
        }
      } else if (role === Role.STUDENT) {
        const student = students.find(s => s.email === username);
        if (student && password === DEFAULT_CREDS.STUDENT_PASS) {
          onLogin({ id: student.id, username, name: student.name, role, department: student.department });
        } else {
          setError('Invalid Student email or password.');
        }
      } else if (role === Role.PARENT) {
        const parent = parentList.find(p => p.email === username);
        if (parent && password === DEFAULT_CREDS.PARENT_PASS) {
            onLogin({ 
                id: parent.id, 
                username, 
                name: parent.name, 
                role, 
                studentId: parent.studentId 
            });
        } else {
            setError('Invalid Parent email or password.');
        }
      }
    } else {
      // Registration Simulation
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        name, 
        role,
      };
      onLogin(newUser);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setResetStatus('sending');

    // Check if user exists to personalize the message
    const foundUser = students.find(s => s.email === resetEmail) || 
                      staffList.find(s => s.email === resetEmail) || 
                      parentList.find(p => p.email === resetEmail);
    
    const targetName = foundUser ? foundUser.name : 'User';
    setResetUserName(targetName);

    // Simulate API call
    setTimeout(() => {
        setResetStatus('sent');
        console.log(`[Email Service Simulation] Password reset link sent to: ${resetEmail} for user ${targetName}`);
    }, 1500);
  };

  const closeResetModal = () => {
    setShowForgotPassword(false);
    setResetStatus('idle');
    setResetEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden z-10 border border-white/20">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-3 rounded-xl mb-4 backdrop-blur-sm border border-white/10 shadow-lg">
                <GraduationCap size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">EduSphere</h2>
            <p className="text-indigo-100 mt-2 font-medium">Academic Management System</p>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex justify-center mb-6 space-x-1 bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${isLogin ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 animate-fade-in">
              <div className="w-1 h-4 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Your Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { r: Role.ADMIN1, label: 'Admin I', icon: <Shield size={14} /> },
                  { r: Role.ADMIN2, label: 'Admin II', icon: <UserCheck size={14} /> },
                  { r: Role.STUDENT, label: 'Student', icon: <GraduationCap size={14} /> },
                  { r: Role.STAFF, label: 'Staff', icon: <BookOpen size={14} /> },
                  { r: Role.HOD, label: 'HOD', icon: <Briefcase size={14} /> },
                  { r: Role.PARENT, label: 'Parent', icon: <UserIcon size={14} /> }
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => { setRole(item.r); setError(''); }}
                    className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                      role === item.r 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500 shadow-sm' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{role === Role.ADMIN1 || role === Role.ADMIN2 ? 'Username' : 'Email Address'}</label>
              <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === Role.ADMIN1 ? 'admin1' : 'user@edusphere.edu'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                />
              </div>
            </div>

            {isLogin && (
                <div className="flex justify-end">
                    <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors"
                    >
                        Forgot Password?
                    </button>
                </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg hover:translate-y-[-1px] flex items-center justify-center gap-2"
            >
              {isLogin ? 'Access Dashboard' : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative border border-gray-200 animate-slide-up">
                  <button onClick={closeResetModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-1 rounded-full">
                      <X size={20} />
                  </button>
                  
                  {resetStatus === 'sent' ? (
                      <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                              <CheckCircle size={32} />
                          </div>
                          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Check Your Email</h2>
                          <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                              We've sent a password reset link to <br/>
                              <span className="font-semibold text-indigo-600">{resetEmail}</span>
                          </p>

                          {/* SIMULATED EMAIL INBOX */}
                          <div className="bg-slate-50 rounded-xl border border-gray-200 p-4 mb-6 text-left shadow-inner">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                  <span className="text-[10px] text-gray-400 ml-auto font-mono uppercase tracking-widest">Simulation</span>
                              </div>
                              <div className="text-xs space-y-1 mb-3 font-mono">
                                  <div className="text-gray-600"><span className="text-gray-400">From:</span> support@edusphere.edu</div>
                                  <div className="text-gray-600"><span className="text-gray-400">Subj:</span> Reset Your Password</div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm shadow-sm text-gray-700">
                                  <p className="mb-2">Hello <span className="font-semibold">{resetUserName}</span>,</p>
                                  <p className="mb-2">Click below to reset your password:</p>
                                  <a href="#" className="text-indigo-600 hover:text-indigo-800 underline text-xs font-mono break-all flex items-center gap-1">
                                      https://edusphere.edu/reset?token=abc12345
                                      <ExternalLink size={10}/>
                                  </a>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-3 text-center italic">
                                  (This is a secure simulation. No real email was sent.)
                              </p>
                          </div>

                          <button onClick={closeResetModal} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md">
                              Return to Login
                          </button>
                      </div>
                  ) : (
                      <>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
                                <Lock size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Reset Password</h2>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">Enter your registered email address and we'll send you a secure link to reset your password.</p>
                        </div>
                        
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                                    <input 
                                        type="email" 
                                        required 
                                        className="w-full border border-gray-300 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all" 
                                        placeholder="you@edusphere.edu"
                                        value={resetEmail}
                                        onChange={e => setResetEmail(e.target.value)}
                                        disabled={resetStatus === 'sending'}
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={resetStatus === 'sending'}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                {resetStatus === 'sending' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Sending...
                                    </>
                                ) : 'Send Reset Link'}
                            </button>
                        </form>
                        <div className="mt-6 text-center">
                            <button onClick={closeResetModal} className="text-sm text-gray-500 hover:text-gray-800 font-medium flex items-center justify-center gap-1 mx-auto transition-colors">
                                Back to Login
                            </button>
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
