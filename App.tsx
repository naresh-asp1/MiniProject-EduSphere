
import React, { useState, useEffect } from 'react';
import { Role, User, Student, ChangeRequest, Department, StaffProfile, INITIAL_STUDENTS, INITIAL_DEPARTMENTS, INITIAL_STAFF } from './types';
import { Auth } from './components/Auth';
import { Admin1Dashboard } from './components/Admin1Dashboard';
import { Admin2Dashboard } from './components/Admin2Dashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { LogOut, UserCircle, GraduationCap, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Database States
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [staffList, setStaffList] = useState<StaffProfile[]>(INITIAL_STAFF);

  // Persist to local storage
  useEffect(() => {
    const savedStudents = localStorage.getItem('edusphere_students');
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    
    const savedReqs = localStorage.getItem('edusphere_requests');
    if (savedReqs) setRequests(JSON.parse(savedReqs));

    const savedDepts = localStorage.getItem('edusphere_departments');
    if (savedDepts) setDepartments(JSON.parse(savedDepts));

    const savedStaff = localStorage.getItem('edusphere_staff');
    if (savedStaff) setStaffList(JSON.parse(savedStaff));
  }, []);

  useEffect(() => {
    localStorage.setItem('edusphere_students', JSON.stringify(students));
    localStorage.setItem('edusphere_requests', JSON.stringify(requests));
    localStorage.setItem('edusphere_departments', JSON.stringify(departments));
    localStorage.setItem('edusphere_staff', JSON.stringify(staffList));
  }, [students, requests, departments, staffList]);

  const handleLogout = () => {
    setUser(null);
    setShowLanding(true);
  };

  // Get Current Student for Student View
  const currentStudent = user?.role === Role.STUDENT 
      ? (students.find(s => s.email === user.username || s.id === user.id) || students[0]) 
      : students[0];

  // Get Current Staff for Staff View
  const currentStaff = user?.role === Role.STAFF
      ? staffList.find(s => s.id === user.id)
      : undefined;

  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-800 to-black flex flex-col items-center justify-center text-white relative overflow-hidden">
         {/* Abstract Background Shapes */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
         </div>

         <div className="z-10 text-center space-y-8 p-8 max-w-2xl">
            <div className="mx-auto bg-white/10 backdrop-blur-md p-6 rounded-full w-32 h-32 flex items-center justify-center border border-white/20 shadow-2xl mb-6">
                <GraduationCap size={64} className="text-indigo-300" />
            </div>
            
            <h1 className="text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
              EduSphere
            </h1>
            <p className="text-xl text-blue-100 font-light tracking-wide">
              Excellence in Education & Management
            </p>

            <div className="pt-8">
              <button 
                onClick={() => setShowLanding(false)}
                className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 flex items-center gap-3 mx-auto"
              >
                Get Started
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
         </div>
         
         <div className="absolute bottom-4 text-xs text-slate-500">
            © 2024 EduSphere Management System
         </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} students={students} staffList={staffList} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="bg-indigo-600 p-1.5 rounded-lg mr-3">
                <GraduationCap className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">EduSphere</span>
              <span className="ml-4 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium uppercase tracking-wide border border-gray-200">
                {user.role === Role.ADMIN1 ? 'Admin I' : user.role === Role.ADMIN2 ? 'Admin II' : user.role} Portal
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-700">
                <UserCircle className="mr-2 text-gray-400" size={20} />
                <div className="flex flex-col items-end leading-tight">
                    <span className="text-sm font-medium">{user.name}</span>
                    {user.department && <span className="text-xs text-gray-400">{user.department}</span>}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4">
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
          />
        )}
        
        {user.role === Role.ADMIN2 && (
          <Admin2Dashboard 
            students={students} 
            setStudents={setStudents}
            requests={requests}
            setRequests={setRequests}
          />
        )}
        
        {user.role === Role.STAFF && (
          <StaffDashboard 
            students={students} 
            setStudents={setStudents}
            departments={departments}
            currentUser={currentStaff}
          />
        )}
        
        {user.role === Role.STUDENT && (
          <StudentDashboard 
            student={currentStudent} 
            requests={requests} 
            setRequests={setRequests} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
