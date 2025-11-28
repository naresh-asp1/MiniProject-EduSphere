import React, { useState } from 'react';
import { User, Role, Student, StaffProfile, ParentProfile, DEFAULT_CREDS } from '../types';
import { UserCheck, Shield, GraduationCap, BookOpen, Info, Users, X, User as UserIcon, Lock, CheckCircle, Mail, ExternalLink } from 'lucide-react';

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

  // Demo User List State
  const [showUserList, setShowUserList] = useState(false);
  const [activeListTab, setActiveListTab] = useState<'staff' | 'students' | 'parents'>('staff');

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

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
      } else if (role === Role.STAFF) {
        // Handles both Regular Staff and HOD
        const staff = staffList.find(s => s.email === username);
        if (staff && password === DEFAULT_CREDS.STAFF_PASS) {
          // Auto-detect role based on isHod flag
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
    // Simulate API call
    setTimeout(() => {
        setResetStatus('sent');
        console.log(`[Email Service Simulation] Password reset link sent to: ${resetEmail}`);
    }, 1500);
  };

  const closeResetModal = () => {
    setShowForgotPassword(false);
    setResetStatus('idle');
    setResetEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">EduSphere</h2>
          <p className="text-indigo-200 mt-2">Student Management System</p>
        </div>
        
        <div className="p-8">
          <div className="flex justify-center mb-6 space-x-4">
            <button 
              onClick={() => setIsLogin(true)}
              className={`pb-2 text-sm font-medium transition-colors ${isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`pb-2 text-sm font-medium transition-colors ${!isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg flex gap-2 items-start">
             <Info size={16} className="mt-0.5 shrink-0" />
             <div>
               <strong>Default Credentials (Demo):</strong><br/>
               Admin I: {DEFAULT_CREDS.ADMIN1.user} / {DEFAULT_CREDS.ADMIN1.pass}<br/>
               Staff/HOD: [Email] / {DEFAULT_CREDS.STAFF_PASS}<br/>
               Parent: [Email] / {DEFAULT_CREDS.PARENT_PASS}<br/>
             </div>
          </div>

          <button 
            onClick={() => setShowUserList(true)}
            className="w-full mb-4 py-2 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 flex items-center justify-center gap-2"
          >
              <Users size={16} /> View All Demo Users & Passwords
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{role === Role.ADMIN1 || role === Role.ADMIN2 ? 'Username' : 'Email Address'}</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === Role.ADMIN1 ? 'admin1' : 'email@edusphere.edu'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {isLogin && (
                <div className="flex justify-end">
                    <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                    >
                        Forgot Password?
                    </button>
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { r: Role.ADMIN1, label: 'Admin I', icon: <Shield size={14} /> },
                  { r: Role.ADMIN2, label: 'Admin II', icon: <UserCheck size={14} /> },
                  { r: Role.STAFF, label: 'Staff/HOD', icon: <BookOpen size={14} /> },
                  { r: Role.STUDENT, label: 'Student', icon: <GraduationCap size={14} /> },
                  { r: Role.PARENT, label: 'Parent', icon: <UserIcon size={14} /> }
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => { setRole(item.r); setError(''); }}
                    className={`flex items-center justify-center gap-1.5 px-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      role === item.r 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      {/* USER CREDENTIALS MODAL */}
      {showUserList && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Demo User Credentials</h2>
                <button onClick={() => setShowUserList(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <div className="flex border-b">
                <button 
                  onClick={() => setActiveListTab('staff')}
                  className={`flex-1 py-3 font-medium text-sm ${activeListTab === 'staff' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Staff & HOD
                </button>
                <button 
                  onClick={() => setActiveListTab('students')}
                  className={`flex-1 py-3 font-medium text-sm ${activeListTab === 'students' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Students
                </button>
                <button 
                  onClick={() => setActiveListTab('parents')}
                  className={`flex-1 py-3 font-medium text-sm ${activeListTab === 'parents' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Parents
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 sticky top-0 shadow-sm">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email (Username)</th>
                            <th className="p-4">Linked Info</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {activeListTab === 'staff' && (
                            staffList.map(s => (
                                <tr key={s.id} className={s.isHod ? "bg-indigo-50 hover:bg-indigo-100" : "hover:bg-gray-50"}>
                                    <td className="p-4">{s.name} <span className="text-xs text-gray-400 ml-1">({s.isHod ? 'HOD' : 'Staff'})</span></td>
                                    <td className="p-4 font-mono text-indigo-600 select-all">{s.email}</td>
                                    <td className="p-4">{s.department}</td>
                                </tr>
                            ))
                        )}
                        {activeListTab === 'students' && (
                            students.slice(0, 50).map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="p-4">{s.name}</td>
                                    <td className="p-4 font-mono text-indigo-600 select-all">{s.email}</td>
                                    <td className="p-4">{s.department} - {s.grade}</td>
                                </tr>
                            ))
                        )}
                         {activeListTab === 'parents' && (
                            parentList.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-4">{p.name}</td>
                                    <td className="p-4 font-mono text-indigo-600 select-all">{p.email}</td>
                                    <td className="p-4">Child: {students.find(s => s.id === p.studentId)?.name || p.studentId}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 border-t bg-gray-50 text-right">
                <button onClick={() => setShowUserList(false)} className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl relative">
                  <button onClick={closeResetModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                      <X size={20} />
                  </button>
                  
                  {resetStatus === 'sent' ? (
                      <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle size={32} />
                          </div>
                          <h2 className="text-2xl font-bold text-gray-800">Check Your Email</h2>
                          <p className="text-sm text-gray-500 mt-2 mb-6">
                              We've sent a password reset link to <br/>
                              <span className="font-semibold text-gray-700">{resetEmail}</span>
                          </p>

                          {/* SIMULATED EMAIL INBOX */}
                          <div className="bg-gray-100 rounded-lg border border-gray-200 p-4 mb-6 text-left shadow-inner">
                              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                  <span className="text-[10px] text-gray-500 ml-auto font-mono">Simulated Inbox</span>
                              </div>
                              <div className="text-xs space-y-1 mb-3">
                                  <div className="text-gray-500"><span className="font-bold">From:</span> support@edusphere.edu</div>
                                  <div className="text-gray-500"><span className="font-bold">Subject:</span> Reset Your Password</div>
                              </div>
                              <div className="bg-white p-3 rounded border border-gray-200 text-sm">
                                  <p className="mb-2">Hello,</p>
                                  <p className="mb-2">Click below to reset:</p>
                                  <a href="#" className="text-blue-600 underline text-xs font-mono break-all flex items-center gap-1">
                                      https://edusphere.edu/reset?token=abc12345
                                      <ExternalLink size={10}/>
                                  </a>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                                  (This is a simulation. No real email was sent.)
                              </p>
                          </div>

                          <button onClick={closeResetModal} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow">
                              Return to Login
                          </button>
                      </div>
                  ) : (
                      <>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
                            <p className="text-sm text-gray-500 mt-2">Enter your registered email address and we'll send you a link to reset your password.</p>
                        </div>
                        
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={16}/>
                                    <input 
                                        type="email" 
                                        required 
                                        className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
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
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-lg transition-colors shadow flex items-center justify-center gap-2"
                            >
                                {resetStatus === 'sending' ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                        <div className="mt-6 text-center">
                            <button onClick={closeResetModal} className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-1 mx-auto">
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