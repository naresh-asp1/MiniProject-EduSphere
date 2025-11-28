import React, { useState } from 'react';
import { Student, Department, AttendanceRecord, StaffProfile, CURRICULUM, getSubjectsForSem } from '../types';
import { Edit3, Sparkles, Calendar, BookOpen, AlertTriangle, FileText, Search, Filter, CheckSquare, Users, UserCheck, UserPlus, X, Mail, Phone, MapPin, Briefcase, Library, Globe, Lock, UserCog, Download } from 'lucide-react';
import { generateStudentReport } from '../services/geminiService';
import { generateStudentPDF } from '../services/pdfService';

interface StaffProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  departments: Department[];
  currentUser: StaffProfile | undefined;
  setStaffList: React.Dispatch<React.SetStateAction<StaffProfile[]>>;
  staffList: StaffProfile[];
}

export const StaffDashboard: React.FC<StaffProps> = ({ students, setStudents, departments, currentUser, setStaffList, staffList }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'records' | 'dept_admin'>('attendance');
  
  // -- ATTENDANCE TAB STATE --
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attFilterDept, setAttFilterDept] = useState('');
  const [attFilterGrade, setAttFilterGrade] = useState('');
  const [attendanceList, setAttendanceList] = useState<{id: string, name: string, status: 'Present' | 'Absent'}[]>([]);

  // -- RECORDS TAB STATE --
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [backlogSubject, setBacklogSubject] = useState('');
  const [recordsFilter, setRecordsFilter] = useState<'all' | 'mentees'>('all');
  const [showMenteeModal, setShowMenteeModal] = useState(false);

  // -- HOD ADMIN STATE --
  const [hodTab, setHodTab] = useState<'subjects' | 'tutors'>('subjects');
  const [selectedStaffForAllocation, setSelectedStaffForAllocation] = useState<StaffProfile | null>(null);
  const [allocationDeptFilter, setAllocationDeptFilter] = useState(currentUser?.department || '');

  const student = students.find(s => s.id === selectedStudentId);
  const isHod = currentUser?.isHod || false;
  const staffDept = currentUser?.department;

  const filteredStudents = students.filter(s => {
      const isDepartmentStudent = staffDept ? s.department === staffDept : false;
      const isMyMentee = s.tutorId === currentUser?.id;
      
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (recordsFilter === 'mentees') {
          return isMyMentee && matchSearch;
      }
      return (isDepartmentStudent || isMyMentee) && matchSearch;
  });

  const unassignedStudents = students.filter(s => 
    s.department === staffDept && !s.tutorId
  );

  // --- ATTENDANCE LOGIC ---
  const loadClassList = () => {
      if (!selectedClassSubject || !staffDept) return;
      
      // Determine Semester for the selected subject (Need to search across ALL curriculums now since cross-dept is allowed)
      let subjectSemester = -1;
      
      // We scan all departments to find the subject code's semester
      departments.forEach(dept => {
           for (let s = 1; s <= 8; s++) {
               const subjects = getSubjectsForSem(dept.id, s);
               if (subjects.find(sub => sub.code === selectedClassSubject)) {
                   subjectSemester = s;
                   break;
               }
           }
      });

      let classStudents = students.filter(s => {
         const hasSubject = s.marks.some(m => m.code === selectedClassSubject);
         // If subject sem found, ensure student is in that semester.
         const isCorrectSemester = subjectSemester !== -1 ? s.currentSemester === subjectSemester : true;
         return hasSubject && isCorrectSemester;
      });
      
      if (attFilterDept) classStudents = classStudents.filter(s => s.department === attFilterDept);
      if (attFilterGrade) classStudents = classStudents.filter(s => s.grade === attFilterGrade);

      setAttendanceList(classStudents.map(s => {
          const existingRecord = s.attendanceLog.find(
              log => log.date === attendanceDate && log.courseCode === selectedClassSubject
          );
          return {
              id: s.id,
              name: s.name,
              status: existingRecord ? existingRecord.status : 'Present'
          };
      }));
  };

  const toggleAttendanceStatus = (id: string) => {
      setAttendanceList(prev => prev.map(item => 
          item.id === id ? { ...item, status: item.status === 'Present' ? 'Absent' : 'Present' } : item
      ));
  };

  const submitBulkAttendance = () => {
      if (attendanceList.length === 0) return;
      const updatedStudents = students.map(s => {
          const attRecord = attendanceList.find(a => a.id === s.id);
          if (attRecord) {
              const existingLogs = s.attendanceLog.filter(
                  log => !(log.date === attendanceDate && log.courseCode === selectedClassSubject)
              );
              const newRecord: AttendanceRecord = {
                  id: Math.random().toString(36),
                  date: attendanceDate,
                  courseCode: selectedClassSubject,
                  status: attRecord.status,
                  department: s.department
              };
              const newLog = [...existingLogs, newRecord];
              const total = newLog.length;
              const present = newLog.filter(r => r.status === 'Present').length;
              const percentage = total === 0 ? 100 : Math.round((present / total) * 100);
              return { ...s, attendanceLog: newLog, attendancePercentage: percentage };
          }
          return s;
      });
      setStudents(updatedStudents);
      alert(`Attendance updated for ${attendanceList.length} students on ${attendanceDate}.`);
      setAttendanceList([]);
  };

  // --- RECORDS LOGIC ---
  const updateStudentState = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleMarksChange = (subjectCode: string, value: string) => {
    if (!student) return;
    const numValue = Math.min(100, Math.max(0, Number(value)));
    const updatedMarks = student.marks.map(m => 
      m.code === subjectCode ? { ...m, score: numValue } : m
    );
    updateStudentState({ ...student, marks: updatedMarks });
  };

  const addBacklog = () => {
      if (!student || !backlogSubject) return;
      if (student.backlogs.includes(backlogSubject)) return;
      updateStudentState({ ...student, backlogs: [...student.backlogs, backlogSubject] });
      setBacklogSubject('');
  };

  const removeBacklog = (subject: string) => {
      if (!student) return;
      updateStudentState({ ...student, backlogs: student.backlogs.filter(b => b !== subject) });
  };

  const handleGenerateReport = async () => {
    if (!student) return;
    setIsGenerating(true);
    const report = await generateStudentReport(student);
    updateStudentState({ ...student, performanceReport: report });
    setIsGenerating(false);
  };

  const claimMentee = (studentId: string) => {
      if(!currentUser) return;
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, tutorId: currentUser.id } : s));
  };

  // --- HOD ALLOCATION LOGIC ---
  const handleToggleAllocation = (staffId: string, subjectCode: string) => {
      setStaffList(prev => prev.map(s => {
          if (s.id === staffId) {
              const currentAllocations = s.allocatedSubjects || [];
              const newAllocations = currentAllocations.includes(subjectCode)
                  ? currentAllocations.filter(c => c !== subjectCode)
                  : [...currentAllocations, subjectCode];
              
              if (selectedStaffForAllocation?.id === staffId) {
                  setSelectedStaffForAllocation({ ...s, allocatedSubjects: newAllocations });
              }
              // Mark as PENDING verification whenever changed
              return { ...s, allocatedSubjects: newAllocations, allocationStatus: 'pending' };
          }
          return s;
      }));
  };

  const handleHodAutoAssign = () => {
      const deptStudents = students.filter(s => s.department === staffDept && !s.tutorId);
      const deptStaff = staffList.filter(s => s.department === staffDept);

      if (deptStudents.length === 0) { alert("No unassigned students found in this department."); return; }
      if (deptStaff.length === 0) { alert("No staff available in this department."); return; }

      let updatedCount = 0;
      const newStudents = [...students];

      deptStudents.forEach((s, idx) => {
          const assignedStaff = deptStaff[idx % deptStaff.length];
          const realIndex = newStudents.findIndex(ns => ns.id === s.id);
          if (realIndex !== -1) {
              newStudents[realIndex] = { ...newStudents[realIndex], tutorId: assignedStaff.id };
              updatedCount++;
          }
      });
      setStudents(newStudents);
      alert(`Successfully assigned ${updatedCount} students to tutors.`);
  };

  const handleTutorManualChange = (studentId: string, tutorId: string) => {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, tutorId: tutorId } : s));
  };

  const allocatedSubjects = currentUser?.allocatedSubjects || [];
  const allocationVerified = currentUser?.allocationStatus === 'verified';

  const canEditSubject = (subCode: string) => {
      return isHod || allocatedSubjects.includes(subCode);
  };

  // Helper to get subjects for selected allocation filter
  const getSubjectsForAllocation = () => {
      if (!allocationDeptFilter) return [];
      const subjects: {code: string, name: string, semester: number}[] = [];
      // Use getSubjectsForSem to ensure we get generated ones too
      for(let s=1; s<=8; s++) {
          const subs = getSubjectsForSem(allocationDeptFilter, s);
          subs.forEach(sub => subjects.push({...sub, semester: s}));
      }
      return subjects;
  };

  // Validation Check: 1 Primary + 1 Cross
  const checkAllocationRule = (staff: StaffProfile) => {
      const primarySubjects = staff.allocatedSubjects.filter(code => code.startsWith(staff.department));
      const crossSubjects = staff.allocatedSubjects.filter(code => !code.startsWith(staff.department));
      return {
          hasPrimary: primarySubjects.length > 0,
          hasCross: crossSubjects.length > 0,
          isValid: primarySubjects.length > 0 && crossSubjects.length > 0
      };
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b px-6 pt-4 flex gap-6">
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`pb-4 text-sm font-medium flex items-center gap-2 ${activeTab === 'attendance' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <Calendar size={18} /> Class Attendance
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            className={`pb-4 text-sm font-medium flex items-center gap-2 ${activeTab === 'records' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <Users size={18} /> Student Records {isHod && '& Department Overview'}
          </button>
          {isHod && (
              <button 
                onClick={() => setActiveTab('dept_admin')}
                className={`pb-4 text-sm font-medium flex items-center gap-2 ${activeTab === 'dept_admin' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  <Briefcase size={18} /> Dept. Administration
              </button>
          )}
      </div>

      <div className="flex-1 overflow-hidden p-6">
      
      {/* VIEW 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
              {!allocationVerified && !isHod && (
                  <div className="bg-amber-100 p-2 text-center text-amber-800 text-xs font-bold border-b border-amber-200">
                      <Lock size={12} className="inline mr-1"/> Your subject allocations are pending verification by Admin II. You cannot mark attendance yet.
                  </div>
              )}
              
              <div className="p-6 border-b bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Attendance Register</h2>
                  <div className="flex flex-wrap gap-4 items-end">
                      <div className="min-w-[200px] flex-1">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Select Subject</label>
                          <select 
                            className="w-full border p-2 rounded" 
                            value={selectedClassSubject} 
                            onChange={e => { setSelectedClassSubject(e.target.value); setAttendanceList([]); }}
                            disabled={!allocationVerified && !isHod}
                          >
                              <option value="">-- Select Subject --</option>
                              {allocatedSubjects.map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                              ))}
                          </select>
                      </div>

                      <div className="w-40">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Filter Dept</label>
                          <select className="w-full border p-2 rounded text-sm" value={attFilterDept} onChange={e => setAttFilterDept(e.target.value)}>
                              <option value="">All Departments</option>
                              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                      </div>

                      <div className="w-32">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Filter Grade</label>
                          <select className="w-full border p-2 rounded text-sm" value={attFilterGrade} onChange={e => setAttFilterGrade(e.target.value)}>
                              <option value="">All Years</option>
                              <option value="I Year">I Year</option>
                              <option value="II Year">II Year</option>
                              <option value="III Year">III Year</option>
                              <option value="IV Year">IV Year</option>
                          </select>
                      </div>

                      <button 
                        onClick={loadClassList} 
                        disabled={!selectedClassSubject || (!allocationVerified && !isHod)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 h-[38px] flex items-center gap-2"
                      >
                         <Filter size={16}/> Load List
                      </button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0">
                  {attendanceList.length > 0 ? (
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
                              <tr>
                                  <th className="p-4">Roll No</th>
                                  <th className="p-4">Student Name</th>
                                  <th className="p-4">Info</th>
                                  <th className="p-4 text-center">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y">
                              {attendanceList.map(item => (
                                  <tr key={item.id} className={item.status === 'Absent' ? 'bg-red-50' : ''}>
                                      <td className="p-4 font-mono text-gray-600">{item.id}</td>
                                      <td className="p-4 font-medium">{item.name}</td>
                                      <td className="p-4 text-xs text-gray-500">
                                         {students.find(s => s.id === item.id)?.department} • {students.find(s => s.id === item.id)?.grade}
                                      </td>
                                      <td className="p-4 text-center">
                                          <button 
                                            onClick={() => toggleAttendanceStatus(item.id)}
                                            className={`w-24 py-1 rounded-full text-xs font-bold transition-colors ${
                                                item.status === 'Present' 
                                                ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                                                : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                                            }`}
                                          >
                                              {item.status}
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 flex-col text-center p-8">
                          <CheckSquare size={48} className="mb-2 opacity-20"/>
                          <p>Select a subject to load the list.</p>
                      </div>
                  )}
              </div>
              
              {attendanceList.length > 0 && (
                  <div className="p-4 border-t bg-gray-50 flex justify-end">
                      <button onClick={submitBulkAttendance} className="bg-green-600 text-white px-8 py-2 rounded hover:bg-green-700 shadow-lg font-medium">
                          Save / Update Attendance
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* VIEW 2: RECORDS (Unchanged essentially, but uses updated filters) */}
      {activeTab === 'records' && (
        <div className="flex h-full gap-6">
            <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50 border-b space-y-3">
                <div className="space-y-2">
                    {staffDept && (
                        <div className={`text-xs font-bold p-2 rounded text-center uppercase tracking-wide mb-2 border ${isHod ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                             {isHod ? <span className="flex items-center justify-center gap-1"><Briefcase size={12}/> Head of {staffDept}</span> : `Staff: ${currentUser?.name} (${staffDept})`}
                        </div>
                    )}
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button onClick={() => setRecordsFilter('all')} className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${recordsFilter === 'all' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>All Dept</button>
                        <button onClick={() => setRecordsFilter('mentees')} className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${recordsFilter === 'mentees' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>My Mentees</button>
                    </div>
                    {recordsFilter === 'mentees' && (
                        <button onClick={() => setShowMenteeModal(true)} className="w-full mt-2 bg-indigo-100 text-indigo-700 py-2 rounded-md text-xs font-bold border border-indigo-200 hover:bg-indigo-200 flex items-center justify-center gap-1">
                            <UserPlus size={14}/> Add Mentee
                        </button>
                    )}
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
                        <input type="text" placeholder="Search..." className="w-full pl-8 pr-2 py-2 text-sm border rounded-lg outline-none focus:border-indigo-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                </div>
                </div>
                <div className="overflow-y-auto flex-1">
                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                        <button key={s.id} onClick={() => setSelectedStudentId(s.id)} className={`w-full text-left p-4 border-b border-gray-50 hover:bg-indigo-50 transition-colors relative ${selectedStudentId === s.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}>
                            <div className="flex justify-between items-start"><div className="font-medium text-gray-900">{s.name}</div>{s.tutorId === currentUser?.id && <UserCheck size={14} className="text-green-600" />}</div>
                            <div className="text-xs text-gray-500 font-mono">{s.id}</div>
                        </button>
                    )) : <div className="p-4 text-center text-gray-400 text-xs">No students found.</div>}
                </div>
            </div>

            <div className="w-3/4 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {student ? (
                <div className="space-y-8">
                    <div className="flex justify-between items-start border-b pb-4">
                        <div><h2 className="text-2xl font-bold text-gray-800">{student.name}</h2><p className="text-gray-500 text-sm">{student.id} • {student.department} • {student.grade}</p></div>
                        <div className="text-right flex flex-col items-end">
                            {student.tutorId === currentUser?.id && <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold mb-1">My Mentee</div>}
                            {isHod && (
                                <button onClick={() => generateStudentPDF(student)} className="mt-2 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                    <Download size={14} /> Download PDF Report
                                </button>
                            )}
                        </div>
                    </div>
                    {(student.tutorId === currentUser?.id || isHod) ? (
                         <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-4">
                            <h3 className="text-xs font-bold text-indigo-800 uppercase mb-3 flex items-center gap-2"><Users size={14} /> Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2"><Mail size={14} className="text-indigo-400"/><span className="text-gray-700">{student.email}</span></div>
                                <div className="flex items-center gap-2"><Phone size={14} className="text-indigo-400"/><span className="text-gray-700">{student.contactNumber}</span></div>
                                <div className="flex items-center gap-2"><CheckSquare size={14} className="text-indigo-400"/><span className="text-gray-700">{student.residenceType}</span></div>
                                <div className="md:col-span-2 flex items-start gap-2"><MapPin size={14} className="text-indigo-400 mt-0.5 shrink-0"/><span className="text-gray-700">{student.address}</span></div>
                            </div>
                         </div>
                    ) : <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-xs font-bold text-gray-600">Restricted Information</div>}

                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Edit3 size={20} /> Update Marks</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {student.marks.map((subject) => {
                            const isAllocated = canEditSubject(subject.code);
                            return (
                                <div key={subject.code} className={`p-3 rounded-lg border ${isAllocated ? 'bg-white border-indigo-200' : 'bg-gray-100 border-gray-200 opacity-70'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <label className="text-xs font-bold text-gray-600">{subject.code}</label>
                                        {isAllocated && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">Access</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2 h-8 line-clamp-2">{subject.name}</div>
                                    <input type="number" disabled={!isAllocated} value={subject.score} onChange={(e) => handleMarksChange(subject.code, e.target.value)} className={`w-full p-2 border rounded text-center font-mono outline-none ${isAllocated ? 'focus:ring-2 ring-indigo-200' : 'cursor-not-allowed bg-gray-200'}`} />
                                </div>
                            );
                        })}
                        </div>
                    </div>
                    <div>
                         <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText size={20} /> AI Report</h3><button onClick={handleGenerateReport} disabled={isGenerating} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"><Sparkles size={16} /> Generate</button></div>
                         <div className="p-4 bg-gray-50 rounded border border-gray-200 italic text-gray-600">{student.performanceReport || "No report generated."}</div>
                    </div>
                </div>
                ) : <div className="h-full flex items-center justify-center text-gray-400 flex-col"><BookOpen size={48} className="mb-2 opacity-20"/><p>Select a student to view details.</p></div>}
            </div>
        </div>
      )}

      {/* VIEW 3: DEPT ADMIN (HOD ONLY) */}
      {activeTab === 'dept_admin' && isHod && (
          <div className="flex flex-col h-full">
               <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-lg border border-purple-100 shadow-sm mx-6 mt-2">
                   <span className="text-xs font-bold text-purple-900 uppercase px-3">Administration:</span>
                   <button 
                      onClick={() => setHodTab('subjects')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${hodTab === 'subjects' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                      <BookOpen size={16} /> Subject Allocation
                  </button>
                  <button 
                      onClick={() => setHodTab('tutors')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${hodTab === 'tutors' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                      <UserCog size={16} /> Tutor Assignment
                  </button>
               </div>
      
               <div className="flex-1 overflow-hidden px-6 pb-6">
               {hodTab === 'subjects' ? (
                  <div className="flex h-full gap-6">
                      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                          <div className="p-4 bg-purple-50 border-b border-purple-100">
                              <h3 className="font-bold text-purple-900 mb-1">Department Staff</h3>
                              <p className="text-xs text-purple-700">Assign subjects (Primary & Cross-Dept)</p>
                          </div>
                          <div className="overflow-y-auto flex-1">
                              {staffList.filter(s => s.department === staffDept).map(s => {
                                  const ruleCheck = checkAllocationRule(s);
                                  return (
                                  <button
                                      key={s.id}
                                      onClick={() => setSelectedStaffForAllocation(s)}
                                      className={`w-full text-left p-4 border-b border-gray-50 hover:bg-purple-50 transition-colors ${selectedStaffForAllocation?.id === s.id ? 'bg-purple-100 border-l-4 border-l-purple-600' : ''}`}
                                  >
                                      <div className="font-medium text-gray-900">{s.name}</div>
                                      <div className="flex justify-between text-xs mt-1">
                                          <span className="font-mono text-gray-500">{s.id}</span>
                                          {s.allocationStatus === 'pending' && <span className="text-amber-600 font-bold">Pending Verify</span>}
                                          {s.allocationStatus === 'rejected' && <span className="text-red-600 font-bold">Rejected</span>}
                                          {s.allocationStatus === 'verified' && <span className="text-green-600 font-bold">Verified</span>}
                                      </div>
                                      {!ruleCheck.isValid && (
                                          <div className="mt-1 flex gap-1">
                                              {!ruleCheck.hasPrimary && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded">Missing Primary</span>}
                                              {!ruleCheck.hasCross && <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded">Missing Cross-Dept</span>}
                                          </div>
                                      )}
                                  </button>
                              )})}
                          </div>
                      </div>
        
                      <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                          {selectedStaffForAllocation ? (
                              <div className="flex flex-col h-full">
                                  <div className="mb-4 pb-4 border-b">
                                      <h2 className="text-xl font-bold text-gray-800">Allocated Subjects</h2>
                                      <p className="text-gray-500 mb-2">Managing for: <span className="font-semibold text-indigo-600">{selectedStaffForAllocation.name}</span></p>
                                      
                                      <div className="flex items-center gap-4 bg-gray-50 p-2 rounded">
                                          <span className="text-xs font-bold text-gray-500 uppercase">Browse Curriculum:</span>
                                          <select 
                                            className="border p-1 rounded text-sm min-w-[150px]" 
                                            value={allocationDeptFilter} 
                                            onChange={e => setAllocationDeptFilter(e.target.value)}
                                          >
                                              {departments.map(d => (
                                                  <option key={d.id} value={d.id}>{d.name} {d.id === staffDept ? '(Primary)' : '(Cross-Dept)'}</option>
                                              ))}
                                          </select>
                                          <div className="flex-1 text-right text-xs italic text-gray-400">
                                              Changes here require Admin II verification.
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="flex-1 overflow-y-auto pr-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getSubjectsForAllocation().map(sub => {
                                            const isAssigned = selectedStaffForAllocation.allocatedSubjects.includes(sub.code);
                                            return (
                                                <div 
                                                    key={sub.code} 
                                                    onClick={() => handleToggleAllocation(selectedStaffForAllocation.id, sub.code)}
                                                    className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${isAssigned ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                                                >
                                                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${isAssigned ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                                        {isAssigned && <CheckSquare size={14} className="text-white"/>}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-800 flex items-center gap-2">
                                                            {sub.code} 
                                                            {allocationDeptFilter !== staffDept && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded"><Globe size={10} className="inline"/> Cross</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{sub.name} (Sem {sub.semester})</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="h-full flex items-center justify-center text-gray-400 flex-col">
                                  <Library size={48} className="mb-2 opacity-20"/>
                                  <p>Select a staff member to manage subject allocations.</p>
                              </div>
                          )}
                      </div>
                  </div>
               ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
                     <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <div>
                             <h3 className="font-bold text-gray-800">Student Tutor Map</h3>
                             <p className="text-xs text-gray-500">Assign mentors to students in your department.</p>
                        </div>
                        <button onClick={handleHodAutoAssign} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-orange-700">
                             <UserPlus size={16} /> Auto-Assign Unassigned
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-4">Roll No</th>
                                    <th className="p-4">Student Name</th>
                                    <th className="p-4">Grade</th>
                                    <th className="p-4">Assigned Tutor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {students.filter(s => s.department === staffDept).map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-mono text-gray-600">{s.id}</td>
                                        <td className="p-4 font-medium">{s.name}</td>
                                        <td className="p-4 text-xs">{s.grade}</td>
                                        <td className="p-4">
                                            <select 
                                                className={`border rounded p-2 text-sm w-full max-w-xs ${!s.tutorId ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                                value={s.tutorId || ''}
                                                onChange={(e) => handleTutorManualChange(s.id, e.target.value)}
                                            >
                                                <option value="">-- Select Tutor --</option>
                                                {staffList.filter(st => st.department === staffDept).map(st => (
                                                    <option key={st.id} value={st.id}>{st.name} ({st.id})</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                  </div>
               )}
               </div>
          </div>
      )}

      {/* ADD MENTEE MODAL */}
      {showMenteeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md h-[70vh] flex flex-col shadow-xl">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Add New Mentee</h3>
                    <button onClick={() => setShowMenteeModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <div className="p-3 bg-indigo-50 text-xs text-indigo-800 border-b border-indigo-100">
                    Showing students from <strong>{staffDept}</strong> who are not yet assigned to any tutor.
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    {unassignedStudents.length > 0 ? (
                        unassignedStudents.map(s => (
                            <div key={s.id} className="p-3 border-b hover:bg-gray-50 flex justify-between items-center">
                                <div><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-gray-500 font-mono">{s.id}</p></div>
                                <button onClick={() => claimMentee(s.id)} className="bg-white border border-green-500 text-green-600 hover:bg-green-50 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium transition-colors"><UserPlus size={12} /> Add</button>
                            </div>
                        ))
                    ) : <div className="p-8 text-center text-gray-400 text-sm">No unassigned students.</div>}
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end"><button onClick={() => setShowMenteeModal(false)} className="bg-gray-800 text-white px-4 py-2 rounded text-sm">Done</button></div>
            </div>
        </div>
      )}

      </div>
    </div>
  );
};