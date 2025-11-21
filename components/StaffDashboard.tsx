
import React, { useState } from 'react';
import { Student, Department, AttendanceRecord, StaffProfile } from '../types';
import { Edit3, Sparkles, Calendar, BookOpen, AlertTriangle, FileText, Search, Filter, CheckSquare, Users } from 'lucide-react';
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

  const student = students.find(s => s.id === selectedStudentId);

  // RESTRICTION: Staff can only view students in their own department in the Records tab
  const staffDept = currentUser?.department;

  const filteredStudents = students.filter(s => {
      const matchDept = staffDept ? s.department === staffDept : true;
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
  });

  // --- ATTENDANCE LOGIC ---
  const loadClassList = () => {
      if (!selectedClassSubject) return;
      // Find all students who have this subject in their marks list
      // Note: Attendance allows viewing students from ANY department if they are enrolled in the subject
      const classStudents = students.filter(s => s.marks.some(m => m.code === selectedClassSubject));
      
      setAttendanceList(classStudents.map(s => ({
          id: s.id,
          name: s.name,
          status: 'Present' // Default to Present
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
      setAttendanceList([]); // Reset
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

    const updatedStudent = { ...student, marks: updatedMarks };
    updateStudentState(updatedStudent);
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

  const allocatedSubjects = currentUser?.allocatedSubjects || [];

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
              <Users size={18} /> Student Records & Marks
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
                          <label className="block text-xs font-bold text-gray-500 mb-1">Select Your Subject</label>
                          <select 
                            className="w-full border p-2 rounded" 
                            value={selectedClassSubject} 
                            onChange={e => { setSelectedClassSubject(e.target.value); setAttendanceList([]); }}
                          >
                              <option value="">-- Select Allocated Subject --</option>
                              {allocatedSubjects.map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                              ))}
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
                  {allocatedSubjects.length === 0 && (
                      <p className="text-xs text-red-500 mt-2">You have no allocated subjects. Contact Admin I.</p>
                  )}
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
                          <p>Select a subject and load the list to mark attendance.</p>
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
                        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 p-2 rounded text-center uppercase tracking-wide mb-2">
                             Viewing: {staffDept} Department
                        </div>
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
                        filteredStudents.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStudentId(s.id)}
                                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-indigo-50 transition-colors ${selectedStudentId === s.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                            >
                                <div className="font-medium text-gray-900">{s.name}</div>
                                <div className="text-xs text-gray-500 font-mono">{s.id}</div>
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-400 text-xs">No students found in {staffDept || 'system'}.</div>
                    )}
                </div>
            </div>

            {/* Editor */}
            <div className="w-3/4 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {student ? (
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Edit3 size={20} /> Update Marks
                        </h3>
                        <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded mb-4 border border-yellow-100">
                            Note: You can only edit marks for subjects allocated to you.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {student.marks.map((subject) => {
                            const isAllocated = allocatedSubjects.includes(subject.code);
                            return (
                                <div key={subject.code} className={`p-3 rounded-lg border ${isAllocated ? 'bg-white border-indigo-200' : 'bg-gray-100 border-gray-200 opacity-70'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <label className="text-xs font-bold text-gray-600">{subject.code}</label>
                                        {isAllocated && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">Your Subject</span>}
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

      </div>
    </div>
  );
};
