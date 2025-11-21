
import React, { useState } from 'react';
import { Student, Department, AttendanceRecord } from '../types';
import { Edit3, Sparkles, Calendar, BookOpen, AlertTriangle, FileText, Search, Filter } from 'lucide-react';
import { generateStudentReport } from '../services/geminiService';

interface StaffProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  departments: Department[];
}

export const StaffDashboard: React.FC<StaffProps> = ({ students, setStudents, departments }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Attendance State
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attCourse, setAttCourse] = useState('');
  const [attStatus, setAttStatus] = useState<'Present' | 'Absent'>('Present');

  // Backlog State
  const [backlogSubject, setBacklogSubject] = useState('');

  const student = students.find(s => s.id === selectedStudentId);

  const filteredStudents = students.filter(s => {
      const matchDept = deptFilter ? s.department === deptFilter : true;
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
  });

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

  const addAttendanceRecord = () => {
      if (!student || !attCourse) return;
      
      const newRecord: AttendanceRecord = {
          id: Math.random().toString(36),
          date: attDate,
          courseCode: attCourse,
          status: attStatus,
          department: student.department
      };

      const newLog = [...student.attendanceLog, newRecord];
      
      // Recalculate Percentage
      const total = newLog.length;
      const present = newLog.filter(r => r.status === 'Present').length;
      const percentage = total === 0 ? 100 : Math.round((present / total) * 100);

      updateStudentState({ 
          ...student, 
          attendanceLog: newLog,
          attendancePercentage: percentage
      });
      
      // Reset form
      setAttCourse('');
      alert(`Attendance recorded: ${attStatus}`);
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

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-6">
      {/* Sidebar List */}
      <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 border-b space-y-3">
           <div>
               <h2 className="font-bold text-gray-700">Student Management</h2>
               <p className="text-xs text-gray-500">Find and manage students</p>
           </div>
           
           {/* FILTERS */}
           <div className="space-y-2">
               <div className="relative">
                   <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
                   <input 
                     type="text" 
                     placeholder="Search Name or Roll No..." 
                     className="w-full pl-8 pr-2 py-2 text-sm border rounded-lg focus:border-indigo-500 outline-none"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
               </div>
               <div className="relative">
                   <Filter size={14} className="absolute left-2 top-2.5 text-gray-400" />
                   <select 
                     className="w-full pl-8 pr-2 py-2 text-sm border rounded-lg focus:border-indigo-500 outline-none bg-white appearance-none"
                     value={deptFilter}
                     onChange={e => setDeptFilter(e.target.value)}
                   >
                       <option value="">All Departments</option>
                       {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
               </div>
           </div>
        </div>
        <div className="overflow-y-auto flex-1">
            {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">No students found matching filters.</div>
            ) : (
                <ul>
                {filteredStudents.map(s => (
                    <li key={s.id}>
                    <button
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`w-full text-left p-4 border-b border-gray-50 hover:bg-indigo-50 transition-colors flex justify-between items-center ${selectedStudentId === s.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                    >
                        <div>
                            <div className="font-medium text-gray-900">{s.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{s.id} • {s.grade}</div>
                        </div>
                    </button>
                    </li>
                ))}
                </ul>
            )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="w-3/4 overflow-y-auto">
        {student ? (
          <div className="space-y-6 pb-8">
            
            {/* 1. ACADEMIC MARKS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Edit3 size={20} /> Update Marks (Sem {student.currentSemester})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {student.marks.map((subject) => (
                    <div key={subject.code} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                         <label className="text-xs font-bold text-gray-600 uppercase">{subject.code}</label>
                         <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded">{subject.credits} Cr</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2 h-8 line-clamp-2" title={subject.name}>{subject.name}</div>
                      <input
                        type="number"
                        value={subject.score}
                        onChange={(e) => handleMarksChange(subject.code, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-center font-mono focus:border-indigo-500 outline-none focus:ring-2 ring-indigo-100"
                      />
                    </div>
                  ))}
                </div>
            </div>

            {/* 2. DAILY ATTENDANCE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={20} /> Daily Attendance Entry</h3>
                <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                        <input type="date" className="border p-2 rounded" value={attDate} onChange={e => setAttDate(e.target.value)} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Course Code</label>
                        <select 
                            className="w-full border p-2 rounded" 
                            value={attCourse} 
                            onChange={e => setAttCourse(e.target.value)}
                        >
                            <option value="">Select Course...</option>
                            {student.marks.map(s => (
                                <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select className="border p-2 rounded w-32" value={attStatus} onChange={(e) => setAttStatus(e.target.value as any)}>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                        </select>
                    </div>
                    <button onClick={addAttendanceRecord} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Update</button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                    Current Calculated Attendance: <span className="font-bold text-indigo-600">{student.attendancePercentage}%</span> (Based on {student.attendanceLog.length} entries)
                </div>
            </div>

            {/* 3. BACKLOGS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-amber-500" /> Backlogs Management</h3>
                 <div className="flex gap-2 mb-4">
                     <select className="border p-2 rounded flex-1" value={backlogSubject} onChange={e => setBacklogSubject(e.target.value)}>
                        <option value="">Select Subject to Add as Backlog...</option>
                        {student.marks.map(s => (
                            <option key={s.code} value={`${s.code} - ${s.name}`}>{s.code} - {s.name}</option>
                        ))}
                     </select>
                     <button onClick={addBacklog} className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600">Add Backlog</button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                     {student.backlogs.length > 0 ? student.backlogs.map(sub => (
                         <span key={sub} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                             {sub} <button onClick={() => removeBacklog(sub)} className="hover:text-red-900"><AlertTriangle size={12}/></button>
                         </span>
                     )) : <span className="text-gray-400 text-sm">No active backlogs.</span>}
                 </div>
            </div>

            {/* 4. REPORT GENERATION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText size={20} /> Structured Performance Report</h3>
                    <button onClick={handleGenerateReport} disabled={isGenerating} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50">
                        <Sparkles size={16} /> {isGenerating ? 'Generating AI Summary...' : 'Update AI Summary'}
                    </button>
                </div>
                
                {/* STRUCTURED REPORT TABLE VIEW */}
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-700 font-bold">
                            <tr>
                                <th className="p-3 border-r w-1/4">Category</th>
                                <th className="p-3">Details / Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <tr>
                                <td className="p-3 font-medium bg-gray-50 border-r">Marks Summary</td>
                                <td className="p-3">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {student.marks.map(m => (
                                            <div key={m.code} className="flex justify-between border-b border-dashed pb-1">
                                                <span className="font-medium text-gray-600" title={m.name}>{m.code}</span>
                                                <span className="font-bold">{m.score}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium bg-gray-50 border-r">Attendance</td>
                                <td className="p-3">
                                    <span className={`font-bold ${student.attendancePercentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                        {student.attendancePercentage}% 
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">({student.attendanceLog.length} Sessions Recorded)</span>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium bg-gray-50 border-r">Active Backlogs</td>
                                <td className="p-3 text-red-600 font-bold">
                                    {student.backlogs.length > 0 ? student.backlogs.join(", ") : "None"}
                                </td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium bg-gray-50 border-r">Staff Remarks (AI)</td>
                                <td className="p-3 italic text-gray-600">
                                    {student.performanceReport || "No remarks generated yet."}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 flex-col">
            <BookOpen size={48} className="mb-2 opacity-20"/>
            <p>Select a student to begin managing records.</p>
          </div>
        )}
      </div>
    </div>
  );
};
