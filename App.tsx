
import React, { useState, useEffect } from 'react';
import { Role, User, Student, ChangeRequest, Department, StaffProfile, ParentProfile, INITIAL_DEPARTMENTS, Course, AdminProfile } from './types';
import { Auth } from './components/Auth';
import { Admin1Dashboard } from './components/Admin1Dashboard';
import { Admin2Dashboard } from './components/Admin2Dashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { LogOut, UserCircle, GraduationCap, ArrowRight, ShieldCheck, Wifi, WifiOff, Loader2, ChevronRight, Zap, Shield, Users, Sparkles } from 'lucide-react';
import { db } from './services/db';
import { isSupabaseConfigured } from './services/supabase';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);
  
  // Database States
  const [students, setStudents] = useState<Student[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [parentList, setParentList] = useState<ParentProfile[]>([]);
  const [subjects, setSubjects] = useState<Course[]>([]);
  const [adminList, setAdminList] = useState<AdminProfile[]>([]);

  // Initial Data Fetch
  useEffect(() => {
    setIsDbConnected(isSupabaseConfigured());
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedStudents, fetchedStaff, fetchedParents, fetchedReqs, fetchedDepts, fetchedSubjects, fetchedAdmins] = await Promise.all([
                db.fetchStudents(),
                db.fetchStaff(),
                db.fetchParents(),
                db.fetchRequests(),
                db.fetchDepartments(),
                db.fetchSubjects(),
                db.fetchAdmins()
            ]);

            setStudents(fetchedStudents);
            setStaffList(fetchedStaff);
            setParentList(fetchedParents);
            setRequests(fetchedReqs);
            if (fetchedDepts.length > 0) setDepartments(fetchedDepts);
            setSubjects(fetchedSubjects);
            setAdminList(fetchedAdmins);

        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setShowLanding(true);
  };

  // Get Current Student for Student View
  const currentStudent = user?.role === Role.STUDENT 
      ? (students.find(s => s.email === user.username || s.id === user.id) || (students.length > 0 ? students[0] : undefined)) 
      : undefined;

  // Get Current Staff for Staff View
  const currentStaff = (user?.role === Role.STAFF || user?.role === Role.HOD)
      ? staffList.find(s => s.id === user.id)
      : undefined;

  // Get Child Student for Parent View
  const parentStudent = user?.role === Role.PARENT && user.studentId
      ? students.find(s => s.id === user.studentId)
      : undefined;

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-white">
              <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap className="text-indigo-600" size={24} />
                  </div>
              </div>
              <p className="text-gray-400 font-medium tracking-wide text-sm animate-pulse">LOADING EDUSPHERE</p>
          </div>
      );
  }

  if (showLanding) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center text-center px-4 font-sans selection:bg-blue-500 selection:text-white">
         
         {/* Background Effects */}
         <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 z-0"></div>
         
         {/* Animated Glows */}
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-blob"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

         <main className="relative z-10 flex flex-col items-center max-w-5xl mx-auto">
             
             {/* Logo Icon */}
             <div className="mb-8 animate-fade-in">
                 <div className="relative group">
                     <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-1000"></div>
                     <div className="relative bg-slate-900 border border-slate-700/50 p-5 rounded-2xl shadow-2xl">
                        <GraduationCap size={48} className="text-blue-400" strokeWidth={1.5} />
                     </div>
                 </div>
             </div>

             {/* Main Title */}
             <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-6 animate-slide-up drop-shadow-2xl">
                 EduSphere
             </h1>

             {/* Subtitle */}
             <p className="text-xl md:text-3xl font-light text-blue-200/90 tracking-wide mb-12 animate-slide-up delay-100 max-w-3xl leading-relaxed">
                 Excellence in Education and Management
             </p>

             {/* Get Started Button */}
             <div className="animate-slide-up delay-200">
                 <button 
                    onClick={() => setShowLanding(false)}
                    className="group relative inline-flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg tracking-wide transition-all duration-300 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.7)] hover:-translate-y-1"
                 >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5}/>
                 </button>
             </div>

             {/* Connection Status Badge */}
             <div className="mt-16 animate-fade-in delay-300">
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border ${isDbConnected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800/50 text-slate-500 border-slate-700'}`}>
                    {isDbConnected ? <Wifi size={12}/> : <WifiOff size={12}/>}
                    {isDbConnected ? 'System Online' : 'Local Environment'}
                </div>
             </div>

         </main>

         {/* Footer */}
         <footer className="absolute bottom-6 w-full text-center z-10">
         </footer>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} students={students} staffList={staffList} parentList={parentList} adminList={adminList} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-200">
                <GraduationCap className="text-white" size={20} />
              </div>
              <div className="hidden md:block">
                  <span className="block text-lg font-bold text-slate-900 tracking-tight leading-none">EduSphere</span>
              </div>
              <div className="ml-4 h-6 w-px bg-gray-200 hidden md:block"></div>
              <span className="ml-2 md:ml-0 px-3 py-1 rounded-full bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-1.5">
                {user.role === Role.ADMIN1 ? <ShieldCheck size={14} className="text-indigo-600"/> : null}
                {user.role === Role.ADMIN1 ? 'Admin I' : 
                 user.role === Role.ADMIN2 ? 'Admin II' : 
                 user.role === Role.HOD ? 'HOD Workspace' :
                 user.role === Role.STAFF ? 'Staff Workspace' : 
                 user.role === Role.PARENT ? 'Parent Portal' : 'Student Portal'}
              </span>
            </div>
            
            <div className="flex items-center gap-5">
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isDbConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                  {isDbConnected ? <Wifi size={12}/> : <WifiOff size={12}/>}
                  {isDbConnected ? 'Connected' : 'Local'}
              </div>
              
              <div className="flex items-center text-right gap-3">
                <div className="hidden sm:block">
                    <span className="block text-sm font-bold text-slate-800">{user.name}</span>
                    <div className="flex items-center justify-end gap-1">
                        {user.department && <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 rounded">{user.department}</span>}
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full p-0.5 border-2 border-white shadow-md bg-slate-100 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-slate-400 overflow-hidden">
                        {(user.role === Role.STUDENT && currentStudent?.photo) ? (
                            <img src={currentStudent.photo} className="w-full h-full object-cover"/>
                        ) : (user.role === Role.STAFF && currentStaff?.photo) ? (
                            <img src={currentStaff.photo} className="w-full h-full object-cover"/>
                        ) : (
                            <UserCircle size={24} />
                        )}
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                subjects={subjects}
                setSubjects={setSubjects}
                adminList={adminList}
                setAdminList={setAdminList}
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
                subjects={subjects}
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
                subjects={subjects}
                setSubjects={setSubjects}
            />
            )}
            
            {user.role === Role.STUDENT && currentStudent ? (
            <StudentDashboard 
                student={currentStudent} 
                requests={requests} 
                setRequests={setRequests}
                staffList={staffList}
                subjects={subjects}
            />
            ) : user.role === Role.STUDENT && (
                <div className="flex flex-col items-center justify-center h-96 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <UserCircle size={48} className="text-gray-400"/>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Profile Not Found</h2>
                    <p className="text-gray-500 mt-2 max-w-md">
                        We couldn't find a student record associated with <strong>{user.username}</strong>. 
                        Please contact the Administration to have your profile created.
                    </p>
                </div>
            )}

            {user.role === Role.PARENT && parentStudent && (
            <ParentDashboard student={parentStudent} />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
