
import React, { useState } from 'react';
import { Student, Department, AttendanceRecord, StaffProfile } from '../types';
import { Edit3, Sparkles, Calendar, BookOpen, AlertTriangle, FileText, Search, Filter, CheckSquare, Users, UserCheck, UserPlus, X, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import { generateStudentReport } from '../services/geminiService';

interface StaffProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  departments: Department[];
  currentUser: StaffProfile | undefined;
}

export const StaffDashboard: React.FC<StaffProps> = ({ students, setStudents, departments, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'records'>('attendance');
  
  // -- ATTENDANCE TAB STATE --
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState<{id: string, name: string, status: 'Present' | 'Absent'}[]>([]);

  // -- RECORDS TAB STATE --
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [backlogSubject, setBacklogSubject] = useState('');
  const [recordsFilter, setRecordsFilter] = useState<'all' | 'mentees'>('all');
  const [showMenteeModal, setShowMenteeModal] = useState(false);

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

      // HODs see all students in dept, Staff see all students in dept (but limited details)
      return (isDepartmentStudent || isMyMentee) && matchSearch;
  });

  const unassignedStudents = students.filter(s => 
    s.department === staffDept && !s.tutorId
  );

  // --- ATTENDANCE LOGIC ---
  const loadClassList = () => {
      if (!selectedClassSubject) return;
      const classStudents = students.filter(s => s.marks.some(m => m.code === selectedClassSubject));
      setAttendanceList(classStudents.map(s => ({
          id: s.id,
          name: s.name,
          status: 'Present'
      })));
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
              const newRecord: AttendanceRecord = {
                  id: Math.random().toString(36),
                  date: attendanceDate,
                  courseCode: selectedClassSubject,
                  status: attRecord.status,
                  department: s.department
              };
              const newLog = [...s.attendanceLog, newRecord];
              const total = newLog.length;
              const present = newLog.filter(r => r.status === 'Present').length;
              const percentage = total === 0 ? 100 : Math.round((present / total) * 100);
              
              return { ...s, attendanceLog: newLog, attendancePercentage: percentage };
          }
          return s;
      });
      setStudents(updatedStudents);
      alert(`Attendance submitted for ${attendanceList.length} students.`);
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

  const allocatedSubjects = currentUser?.allocatedSubjects || [];

  // HOD has full access to edit marks of any student in dept, or restricted? 
  // Usually HOD can override. Let's assume HOD can edit any mark in their dept.
  // Staff can only edit allocated.
  const canEditSubject = (subCode: string) => {
      return isHod || allocatedSubjects.includes(subCode);
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
      </div>

      <div className="flex-1 overflow-hidden p-6">
      
      {/* VIEW 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
              <div className="p-6 border-b bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Attendance Register</h2>
                  <div className="flex gap-4 items-end">
                      <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Select Subject</label>
                          <select 
                            className="w-full border p-2 rounded" 
                            value={selectedClassSubject} 
                            onChange={e => { setSelectedClassSubject(e.target.value); setAttendanceList([]); }}
                          >
                              <option value="">-- Select Subject --</option>
                              {allocatedSubjects.map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                              ))}
                              {isHod && allocatedSubjects.length === 0 && (
                                  <option disabled>No personal subjects allocated. As HOD, check Records for oversight.</option>
                              )}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                          <input type="date" className="border p-2 rounded" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                      </div>
                      <button 
                        onClick={loadClassList} 
                        disabled={!selectedClassSubject}
                        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                          Load Student List
                      </button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0">
                  {attendanceList.length > 0 ? (
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-100 text-gray-600 sticky top-0">
                              <tr>
                                  <th className="p-4">Roll No</th>
                                  <th className="p-4">Student Name</th>
                                  <th className="p-4 text-center">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y">
                              {attendanceList.map(item => (
                                  <tr key={item.id} className={item.status === 'Absent' ? 'bg-red-50' : ''}>
                                      <td className="p-4 font-mono text-gray-600">{item.id}</td>
                                      <td className="p-4 font-medium">{item.name}</td>
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
                      <div className="h-full flex items-center justify-center text-gray-400 flex-col">
                          <CheckSquare size={48} className="mb-2 opacity-20"/>
                          <p>Select a subject to mark attendance.</p>
                      </div>
                  )}
              </div>
              
              {attendanceList.length > 0 && (
                  <div className="p-4 border-t bg-gray-50 flex justify-end">
                      <button onClick={submitBulkAttendance} className="bg-green-600 text-white px-8 py-2 rounded hover:bg-green-700 shadow-lg font-medium">
                          Submit Attendance
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* VIEW 2: RECORDS */}
      {activeTab === 'records' && (
        <div className="flex h-full gap-6">
            {/* Sidebar */}
            <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50 border-b space-y-3">
                <div className="space-y-2">
                    {staffDept && (
                        <div className={`text-xs font-bold p-2 rounded text-center uppercase tracking-wide mb-2 border ${isHod ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                             {isHod ? <span className="flex items-center justify-center gap-1"><Briefcase size={12}/> Head of {staffDept}</span> : `Staff: ${currentUser?.name} (${staffDept})`}
                        </div>
                    )}
                    
                    {/* Mentor Filter Toggle */}
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button 
                            onClick={() => setRecordsFilter('all')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${recordsFilter === 'all' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            All Dept
                        </button>
                        <button 
                            onClick={() => setRecordsFilter('mentees')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${recordsFilter === 'mentees' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            My Mentees
                        </button>
                    </div>

                    {recordsFilter === 'mentees' && (
                        <button 
                            onClick={() => setShowMenteeModal(true)}
                            className="w-full mt-2 bg-indigo-100 text-indigo-700 py-2 rounded-md text-xs font-bold border border-indigo-200 hover:bg-indigo-200 flex items-center justify-center gap-1"
                        >
                            <UserPlus size={14}/> Add Mentee
                        </button>
                    )}

                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search student..." 
                            className="w-full pl-8 pr-2 py-2 text-sm border rounded-lg outline-none focus:border-indigo-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                </div>
                <div className="overflow-y-auto flex-1">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(s => {
                            const isMentee = s.tutorId === currentUser?.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedStudentId(s.id)}
                                    className={`w-full text-left p-4 border-b border-gray-50 hover:bg-indigo-50 transition-colors relative ${selectedStudentId === s.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-gray-900">{s.name}</div>
                                        {isMentee && <UserCheck size={14} className="text-green-600" title="My Mentee" />}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">{s.id}</div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="p-4 text-center text-gray-400 text-xs">
                            {recordsFilter === 'mentees' ? 'No mentees assigned.' : `No students found.`}
                        </div>
                    )}
                </div>
            </div>

            {/* Editor */}
            <div className="w-3/4 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {student ? (
                <div className="space-y-8">
                    {/* Header Info */}
                    <div className="flex justify-between items-start border-b pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
                            <p className="text-gray-500 text-sm">{student.id} • {student.department} • {student.grade}</p>
                        </div>
                        <div className="text-right">
                             {student.tutorId === currentUser?.id && (
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 mb-1">
                                    <UserCheck size={14}/> My Mentee
                                </div>
                             )}
                             {isHod && (
                                 <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Briefcase size={14}/> HOD Access
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Personal Details (Conditional Access) */}
                    {(student.tutorId === currentUser?.id || isHod) ? (
                         <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-4">
                            <h3 className="text-xs font-bold text-indigo-800 uppercase mb-3 flex items-center gap-2">
                                <Users size={14} /> Personal Details (Restricted View)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-indigo-400"/>
                                    <span className="text-gray-700">{student.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-indigo-400"/>
                                    <span className="text-gray-700">{student.contactNumber}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-indigo-400"/>
                                    <span className="text-gray-700">DOB: {student.dob}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={14} className="text-indigo-400"/>
                                    <span className="text-gray-700">{student.residenceType}</span>
                                </div>
                                <div className="md:col-span-2 flex items-start gap-2">
                                    <MapPin size={14} className="text-indigo-400 mt-0.5 shrink-0"/>
                                    <span className="text-gray-700">{student.address}</span>
                                </div>
                            </div>
                         </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center flex flex-col items-center justify-center">
                            <AlertTriangle className="text-gray-400 mb-2" size={20} />
                            <span className="text-xs font-bold text-gray-600">Restricted Information</span>
                            <span className="text-[10px] text-gray-400 italic">Personal details are only visible to the assigned Tutor or HOD.</span>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Edit3 size={20} /> Update Marks
                        </h3>
                        <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded mb-4 border border-yellow-100">
                            {isHod ? 'As HOD, you have override access to all subjects.' : 'Note: You can only edit marks for subjects allocated to you.'}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {student.marks.map((subject) => {
                            const isAllocated = canEditSubject(subject.code);
                            return (
                                <div key={subject.code} className={`p-3 rounded-lg border ${isAllocated ? 'bg-white border-indigo-200' : 'bg-gray-100 border-gray-200 opacity-70'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <label className="text-xs font-bold text-gray-600">{subject.code}</label>
                                        {isAllocated && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">{isHod ? 'HOD Access' : 'Allocated'}</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2 h-8 line-clamp-2">{subject.name}</div>
                                    <input
                                        type="number"
                                        disabled={!isAllocated}
                                        value={subject.score}
                                        onChange={(e) => handleMarksChange(subject.code, e.target.value)}
                                        className={`w-full p-2 border rounded text-center font-mono outline-none ${isAllocated ? 'focus:ring-2 ring-indigo-200' : 'cursor-not-allowed bg-gray-200'}`}
                                    />
                                </div>
                            );
                        })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-amber-500" /> Backlogs</h3>
                        <div className="flex gap-2 mb-4">
                            <select className="border p-2 rounded flex-1" value={backlogSubject} onChange={e => setBacklogSubject(e.target.value)}>
                                <option value="">Select Subject...</option>
                                {student.marks.map(s => (
                                    <option key={s.code} value={`${s.code} - ${s.name}`}>{s.code} - {s.name}</option>
                                ))}
                            </select>
                            <button onClick={addBacklog} className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {student.backlogs.map(sub => (
                                <span key={sub} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    {sub} <button onClick={() => removeBacklog(sub)} className="hover:text-red-900"><AlertTriangle size={12}/></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText size={20} /> AI Report</h3>
                            <button onClick={handleGenerateReport} disabled={isGenerating} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                                <Sparkles size={16} /> {isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 rounded border border-gray-200 italic text-gray-600">
                            {student.performanceReport || "No report generated."}
                        </div>
                    </div>
                </div>
                ) : (
                <div className="h-full flex items-center justify-center text-gray-400 flex-col">
                    <BookOpen size={48} className="mb-2 opacity-20"/>
                    <p>Select a student to view details.</p>
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
                                <div>
                                    <p className="font-medium text-sm">{s.name}</p>
                                    <p className="text-xs text-gray-500 font-mono">{s.id}</p>
                                </div>
                                <button 
                                    onClick={() => claimMentee(s.id)}
                                    className="bg-white border border-green-500 text-green-600 hover:bg-green-50 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium transition-colors"
                                >
                                    <UserPlus size={12} /> Add
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No unassigned students available in your department.
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                     <button onClick={() => setShowMenteeModal(false)} className="bg-gray-800 text-white px-4 py-2 rounded text-sm">Done</button>
                </div>
            </div>
        </div>
      )}

      </div>
    </div>
  );
};
