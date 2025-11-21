import React, { useState } from 'react';
import { User, Role, Student, StaffProfile, DEFAULT_CREDS } from '../types';
import { UserCheck, Shield, GraduationCap, BookOpen, Info, Users, X } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  students: Student[];
  staffList: StaffProfile[];
}

export const Auth: React.FC<AuthProps> = ({ onLogin, students, staffList }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Demo User List State
  const [showUserList, setShowUserList] = useState(false);
  const [activeListTab, setActiveListTab] = useState<'staff' | 'students'>('staff');

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
        const staff = staffList.find(s => s.email === username);
        if (staff && password === DEFAULT_CREDS.STAFF_PASS) {
          onLogin({ id: staff.id, username, name: staff.name, role, department: staff.department });
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
      }
    } else {
      // Registration Simulation (For demo purposes, allows creation of Student/Staff)
      // In a real app, this would be locked down or require approval.
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        name, 
        role,
      };
      onLogin(newUser);
    }
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
               Admin II: {DEFAULT_CREDS.ADMIN2.user} / {DEFAULT_CREDS.ADMIN2.pass}<br/>
               Staff: [Email] / {DEFAULT_CREDS.STAFF_PASS}<br/>
               Student: [Email] / {DEFAULT_CREDS.STUDENT_PASS}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{role === Role.STAFF || role === Role.STUDENT ? 'Email Address' : 'Username'}</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === Role.STAFF || role === Role.STUDENT ? 'email@edusphere.edu' : 'username'}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { r: Role.ADMIN1, label: 'Admin I', icon: <Shield size={16} /> },
                  { r: Role.ADMIN2, label: 'Admin II', icon: <UserCheck size={16} /> },
                  { r: Role.STAFF, label: 'Staff', icon: <BookOpen size={16} /> },
                  { r: Role.STUDENT, label: 'Student', icon: <GraduationCap size={16} /> }
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => { setRole(item.r); setError(''); }}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border ${
                      role === item.r 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
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
                    Staff List (Password: {DEFAULT_CREDS.STAFF_PASS})
                </button>
                <button 
                  onClick={() => setActiveListTab('students')}
                  className={`flex-1 py-3 font-medium text-sm ${activeListTab === 'students' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Student List (Password: {DEFAULT_CREDS.STUDENT_PASS})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 sticky top-0 shadow-sm">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email (Username)</th>
                            <th className="p-4">Department</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {activeListTab === 'staff' ? (
                            staffList.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="p-4">{s.name}</td>
                                    <td className="p-4 font-mono text-indigo-600 select-all">{s.email}</td>
                                    <td className="p-4">{s.department}</td>
                                </tr>
                            ))
                        ) : (
                            students.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="p-4">{s.name}</td>
                                    <td className="p-4 font-mono text-indigo-600 select-all">{s.email}</td>
                                    <td className="p-4">{s.department}</td>
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
    </div>
  );
};