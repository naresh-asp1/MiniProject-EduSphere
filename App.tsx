
import React, { useState, useEffect } from 'react';
import { Role, User, Student, ChangeRequest, Department, StaffProfile, ParentProfile, INITIAL_STUDENTS, INITIAL_DEPARTMENTS, INITIAL_STAFF, INITIAL_PARENTS } from './types';
import { Auth } from './components/Auth';
import { Admin1Dashboard } from './components/Admin1Dashboard';
import { Admin2Dashboard } from './components/Admin2Dashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { LogOut, UserCircle, GraduationCap, ArrowRight, CheckCircle2, LayoutDashboard, ShieldCheck, Users, Zap, Globe, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Database States
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [staffList, setStaffList] = useState<StaffProfile[]>(INITIAL_STAFF);
  const [parentList, setParentList] = useState<ParentProfile[]>(INITIAL_PARENTS);

  // Persist to local storage
  useEffect(() => {
    const savedStudents = localStorage.getItem('edusphere_students_v2');
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    
    const savedReqs = localStorage.getItem('edusphere_requests_v2');
    if (savedReqs) setRequests(JSON.parse(savedReqs));

    const savedDepts = localStorage.getItem('edusphere_departments_v2');
    if (savedDepts) setDepartments(JSON.parse(savedDepts));

    const savedStaff = localStorage.getItem('edusphere_staff_v2');
    if (savedStaff) setStaffList(JSON.parse(savedStaff));

    const savedParents = localStorage.getItem('edusphere_parents_v2');
    if (savedParents) setParentList(JSON.parse(savedParents));
  }, []);

  useEffect(() => {
    localStorage.setItem('edusphere_students_v2', JSON.stringify(students));
    localStorage.setItem('edusphere_requests_v2', JSON.stringify(requests));
    localStorage.setItem('edusphere_departments_v2', JSON.stringify(departments));
    localStorage.setItem('edusphere_staff_v2', JSON.stringify(staffList));
    localStorage.setItem('edusphere_parents_v2', JSON.stringify(parentList));
  }, [students, requests, departments, staffList, parentList]);

  const handleLogout = () => {
    setUser(null);
    setShowLanding(true);
  };

  // Get Current Student for Student View
  const currentStudent = user?.role === Role.STUDENT 
      ? (students.find(s => s.email === user.username || s.id === user.id) || students[0]) 
      : students[0];

  // Get Current Staff for Staff View (Also handles HOD logic)
  const currentStaff = (user?.role === Role.STAFF || user?.role === Role.HOD)
      ? staffList.find(s => s.id === user.id)
      : undefined;

  // Get Child Student for Parent View
  const parentStudent = user?.role === Role.PARENT && user.studentId
      ? students.find(s => s.id === user.studentId)
      : undefined;

  if (showLanding) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
         {/* Navbar */}
         <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full z-20">
            <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
                    <GraduationCap size={22} />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">EduSphere</span>
            </div>
            <button 
                onClick={() => setShowLanding(false)}
                className="px-5 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition-all shadow-sm"
            >
                Login to Portal
            </button>
         </nav>

         {/* Hero Section */}
         <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden pb-12">
             
             {/* Abstract Background Element */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-full blur-3xl -z-10 opacity-60"></div>

             <div className="max-w-4xl mx-auto space-y-6 animate-fade-in z-10 mt-8">
                 <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Education Management,<br/>
                    <span className="text-indigo-600">Reimagined.</span>
                 </h1>
                 
                 <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
                    The modern operating system for your campus. Seamlessly connect students, faculty, and administration in one secure, intuitive workspace.
                 </p>

                 <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <button 
                        onClick={() => setShowLanding(false)}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button className="px-8 py-4 bg-white text-slate-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-300">
                        View Demo
                    </button>
                 </div>
             </div>
             
             {/* Feature Grid */}
             <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full text-left">
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                        <Zap size={20}/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Instant Updates</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        Real-time synchronization of attendance, marks, and student requests across all departments.
                    </p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-4">
                        <Globe size={20}/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Accessible Anywhere</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        Cloud-based access for parents and students to view performance reports from any device.
                    </p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <Lock size={20}/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Secure Records</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        Two-step verification workflow ensures data integrity and prevents unauthorized changes.
                    </p>
                </div>
             </div>
         </div>
         
         <div className="py-8 text-center text-slate-400 text-xs">
            &copy; {new Date().getFullYear()} EduSphere. All rights reserved.
         </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} students={students} staffList={staffList} parentList={parentList} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-black p-2 rounded-lg">
                <GraduationCap className="text-white" size={20} />
              </div>
              <div className="hidden md:block">
                  <span className="block text-xl font-bold text-slate-800 tracking-tight leading-none">EduSphere</span>
              </div>
              <div className="ml-4 h-6 w-px bg-gray-200 hidden md:block"></div>
              <span className="ml-2 md:ml-0 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wide border border-gray-200 flex items-center gap-1.5">
                {user.role === Role.ADMIN1 ? <ShieldCheck size={12}/> : null}
                {user.role === Role.ADMIN1 ? 'Admin I' : 
                 user.role === Role.ADMIN2 ? 'Admin II' : 
                 user.role === Role.HOD ? 'HOD Workspace' :
                 user.role === Role.STAFF ? 'Staff Workspace' : 
                 user.role === Role.PARENT ? 'Parent Portal' : 'Student Portal'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center text-right">
                <div className="hidden sm:block mr-3">
                    <span className="block text-sm font-semibold text-slate-700">{user.name}</span>
                    <div className="flex items-center justify-end gap-1">
                        {user.department && <span className="text-xs text-slate-500 font-medium">{user.department} {user.isHod ? '(Head)' : ''}</span>}
                        {user.role === Role.PARENT && <span className="text-xs text-slate-500">Parent</span>}
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 p-0.5 border border-gray-200">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-slate-400 overflow-hidden">
                        {/* Show photo in header if available */}
                        {(user.role === Role.STUDENT && currentStudent?.photo) ? (
                            <img src={currentStudent.photo} className="w-full h-full object-cover"/>
                        ) : (user.role === Role.STAFF && currentStaff?.photo) ? (
                            <img src={currentStaff.photo} className="w-full h-full object-cover"/>
                        ) : (
                            <UserCircle size={24} />
                        )}
                    </div>
                </div>
              </div>
              
              <div className="h-8 w-px bg-gray-200 mx-1"></div>
              
              <button 
                onClick={handleLogout}
                className="group p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 tooltip-trigger relative"
                title="Logout"
              >
                <LogOut size={20} className="group-hover:stroke-2" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="animate-fade-in">
            {user.role === Role.ADMIN1 && (
            <Admin1Dashboard 
                students={students} 
                setStudents={setStudents}
                departments={departments}
                setDepartments={setDepartments}
                staffList={staffList}
                setStaffList={setStaffList}
                requests={requests}
                setRequests={setRequests}
                parentList={parentList}
                setParentList={setParentList}
            />
            )}
            
            {user.role === Role.ADMIN2 && (
            <Admin2Dashboard 
                students={students} 
                setStudents={setStudents}
                requests={requests}
                setRequests={setRequests}
                staffList={staffList}
                setStaffList={setStaffList}
            />
            )}
            
            {(user.role === Role.STAFF || user.role === Role.HOD) && (
            <StaffDashboard 
                students={students} 
                setStudents={setStudents}
                departments={departments}
                currentUser={currentStaff}
                setStaffList={setStaffList}
                staffList={staffList}
            />
            )}
            
            {user.role === Role.STUDENT && (
            <StudentDashboard 
                student={currentStudent} 
                requests={requests} 
                setRequests={setRequests}
                staffList={staffList}
            />
            )}

            {user.role === Role.PARENT && parentStudent && (
            <ParentDashboard student={parentStudent} />
            )}
            {user.role === Role.PARENT && !parentStudent && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Users size={32} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No Student Linked</h2>
                    <p className="text-gray-500 max-w-md mx-auto">Your account is not currently linked to a valid student record. Please contact the school administration to resolve this issue.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
