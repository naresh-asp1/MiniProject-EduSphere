

import React, { useState, useEffect } from 'react';
import { Student, Department, AttendanceRecord, StaffProfile, SubjectMark, Course } from '../types';
import { Edit3, Calendar, BookOpen, Search, Filter, CheckSquare, Users, UserCheck, UserPlus, Download, User, Briefcase, Lock, Library, Globe, Save, X, ChevronRight, CheckCircle, AlertCircle, Sparkles, Calculator, FileEdit, Upload, Trash2, Camera, RefreshCw, FileText, ArrowRightLeft, FlaskConical } from 'lucide-react';
import { generateStudentReport, extractCurriculumFromImage, extractCurriculumFromText } from '../services/geminiService';
import { extractTextFromPDF, extractTextFromDocx } from '../services/fileParser';
import { generateStudentPDF } from '../services/pdfService';
import { db } from '../services/db';

interface StaffProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  departments: Department[];
  currentUser: StaffProfile | undefined;
  setStaffList: React.Dispatch<React.SetStateAction<StaffProfile[]>>;
  staffList: StaffProfile[];
  subjects: Course[];
  setSubjects: React.Dispatch<React.SetStateAction<Course[]>>;
}

export const StaffDashboard: React.FC<StaffProps> = ({ students, setStudents, departments, currentUser, setStaffList, staffList, subjects, setSubjects }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'records' | 'dept_admin'>('attendance');
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'subjects' | 'tutors' | 'curriculum'>('subjects');
  
  // Attendance State
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState<{id: string, name: string, status: 'Present' | 'Absent'}[]>([]);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  // Records State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportGenerating, setReportGenerating] = useState(false);
  
  // MARKS MODAL STATE
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [currentMarkEntry, setCurrentMarkEntry] = useState<SubjectMark | null>(null);

  // HOD Admin State
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  
  // HOD CURRICULUM STATE
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [extractedSubjects, setExtractedSubjects] = useState<Course[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Manual Subject Add State
  const [manualSubject, setManualSubject] = useState<Course>({ code: '', name: '', credits: 3, semester: 1, department: '', type: 'Theory' });

  const student = students.find(s => s.id === selectedStudentId);
  const isHod = currentUser?.isHod || false;
  const staffDept = currentUser?.department;

  // Helper to find subject details for strict filtering
  const getSubjectDetails = (code: string) => {
      const sub = subjects.find(s => s.code === code);
      if (sub) return { dept: sub.department, sem: sub.semester, name: sub.name, credits: sub.credits };
      return null;
  };

  // --- ATTENDANCE LOGIC ---

  const loadClassList = () => {
      if (!selectedClassSubject) return;

      const subjectInfo = getSubjectDetails(selectedClassSubject);
      
      let classStudents = students.filter(s => {
          if (subjectInfo) {
              if (s.department === subjectInfo.dept && s.currentSemester === subjectInfo.sem) {
                  return true;
              }
          }
          const hasSubject = s.marks.some(m => m.code === selectedClassSubject);
          if (hasSubject) return true;
          return false;
      });
      
      if (filterDept) classStudents = classStudents.filter(s => s.department === filterDept);
      if (filterGrade) classStudents = classStudents.filter(s => s.grade === filterGrade);

      const existingStatusMap: Record<string, 'Present' | 'Absent'> = {};
      classStudents.forEach(s => {
          const log = s.attendanceLog.find(l => l.date === attendanceDate && l.courseCode === selectedClassSubject);
          if (log) existingStatusMap[s.id] = log.status;
      });

      setAttendanceList(classStudents.map(s => ({ 
          id: s.id, 
          name: s.name, 
          status: existingStatusMap[s.id] || 'Present'
      })));
      setAttendanceLoaded(true);
  };

  const toggleAttendanceStatus = (id: string) => {
      setAttendanceList(prev => prev.map(item => item.id === id ? { ...item, status: item.status === 'Present' ? 'Absent' : 'Present' } : item));
  };

  const submitBulkAttendance = async () => {
      if (attendanceList.length === 0) return;
      
      const studentsToUpdate: Student[] = [];

      const updatedStudents = students.map(s => {
          const attRecord = attendanceList.find(a => a.id === s.id);
          if (attRecord) {
              const cleanLog = s.attendanceLog.filter(l => !(l.date === attendanceDate && l.courseCode === selectedClassSubject));
              
              const newRecord: AttendanceRecord = {
                  id: Math.random().toString(36).substr(2, 9),
                  date: attendanceDate,
                  courseCode: selectedClassSubject,
                  status: attRecord.status,
                  department: s.department
              };
              
              const newLog = [...cleanLog, newRecord];
              const totalDays = newLog.length;
              const presentDays = newLog.filter(r => r.status === 'Present').length;
              const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
              
              const updatedS = { ...s, attendanceLog: newLog, attendancePercentage: percentage };
              studentsToUpdate.push(updatedS);
              return updatedS;
          }
          return s;
      });

      setStudents(updatedStudents);
      await db.bulkUpsertStudents(studentsToUpdate);
      alert("Attendance Saved Successfully!");
      setAttendanceList([]);
      setAttendanceLoaded(false);
  };

  // --- RECORDS LOGIC ---

  const initMarksEntry = (subjectCode: string, subjectName: string) => {
      if (!student) return;
      const subInfo = getSubjectDetails(subjectCode);
      const existing = student.marks.find(m => m.code === subjectCode);

      if (existing) {
          setCurrentMarkEntry({ ...existing });
      } else {
          setCurrentMarkEntry({
            code: subjectCode,
            name: subjectName,
            credits: subInfo?.credits || 3,
            semester: student.currentSemester,
            assignment1: 0,
            assignment2: 0,
            internal1: 0,
            internal2: 0,
            semesterExam: 0,
            total: 0,
            gradeLabel: 'U',
            gradePoint: 0,
            score: 0
          });
      }
      setShowMarksModal(true);
  };

  const calculateGrade = (total: number, semesterScore: number, department: string): { label: string, point: number } => {
      const isPg = ['MBA', 'MCA'].includes(department);
      const passMark = isPg ? 50 : 40;

      // STRICT RULE: Pass/Fail depends strictly on Semester Exam Marks
      if (semesterScore < passMark) {
          return { label: 'RA', point: 0 };
      }

      if (total >= 91) return { label: 'O', point: 10 };
      if (total >= 81) return { label: 'A+', point: 9 };
      if (total >= 71) return { label: 'A', point: 8 };
      if (total >= 61) return { label: 'B+', point: 7 };
      if (total >= 50) return { label: 'B', point: 6 };
      
      // Fallback if total is low but semester passed (unlikely with weights, but for safety)
      return { label: 'RA', point: 0 }; 
  };

  const saveDetailedMarks = async () => {
      if (!student || !currentMarkEntry) return;

      const rawInternal = (Number(currentMarkEntry.assignment1) || 0) + 
                          (Number(currentMarkEntry.assignment2) || 0) + 
                          (Number(currentMarkEntry.internal1) || 0) + 
                          (Number(currentMarkEntry.internal2) || 0);
      
      const weightedInternal = rawInternal * 0.4;
      const rawSemester = Number(currentMarkEntry.semesterExam) || 0;
      const weightedSemester = rawSemester * 0.6;
      const totalScore = Math.round(weightedInternal + weightedSemester);

      // Pass raw semester score and department for strict pass/fail check
      const gradeInfo = calculateGrade(totalScore, rawSemester, student.department);

      const finalizedMark: SubjectMark = {
          ...currentMarkEntry,
          total: totalScore,
          score: totalScore,
          gradeLabel: gradeInfo.label,
          gradePoint: gradeInfo.point
      };

      let updatedMarks = student.marks.filter(m => m.code !== finalizedMark.code);
      updatedMarks.push(finalizedMark);

      let newBacklogs = student.backlogs.filter(b => b !== finalizedMark.code);
      if (gradeInfo.label === 'RA' || gradeInfo.label === 'U') {
          newBacklogs.push(finalizedMark.code);
      }

      let totalPoints = 0;
      let totalCredits = 0;
      updatedMarks.forEach(m => {
          totalPoints += (m.gradePoint * m.credits);
          totalCredits += m.credits;
      });
      const newCgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;

      const updatedStudent = { 
          ...student, 
          marks: updatedMarks, 
          backlogs: newBacklogs,
          cgpa: newCgpa
      };

      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      await db.upsertStudent(updatedStudent);
      setShowMarksModal(false);
  };

  const handleGenerateReport = async () => {
    if (!student) return;
    setReportGenerating(true);
    const report = await generateStudentReport(student);
    const updatedStudent = { ...student, performanceReport: report };
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    await db.upsertStudent(updatedStudent);
    setReportGenerating(false);
  };

  // --- HOD ADMIN LOGIC ---

  const handleSubjectAllocation = async (subjectCode: string, reallocatingFromStaffId?: string) => {
      if (!selectedStaffId) return;

      // 1. If reallocating, remove from old staff first
      if (reallocatingFromStaffId) {
          const oldStaff = staffList.find(s => s.id === reallocatingFromStaffId);
          if (oldStaff) {
              const oldStaffNewSubjects = oldStaff.allocatedSubjects.filter(c => c !== subjectCode);
              const updatedOldStaff = { ...oldStaff, allocatedSubjects: oldStaffNewSubjects, allocationStatus: 'pending' as const };
              // We need to batch updates usually, but we'll do sequential here
              setStaffList(prev => prev.map(s => s.id === oldStaff.id ? updatedOldStaff : s));
              await db.upsertStaff(updatedOldStaff);
          }
      }

      // 2. Add to new staff
      const staff = staffList.find(s => s.id === selectedStaffId);
      if (!staff) return;

      const isAllocated = staff.allocatedSubjects.includes(subjectCode);
      let newAllocations = isAllocated 
          ? staff.allocatedSubjects.filter(c => c !== subjectCode)
          : [...staff.allocatedSubjects, subjectCode];
      
      const updatedStaff: StaffProfile = { 
          ...staff, 
          allocatedSubjects: newAllocations, 
          allocationStatus: 'pending' 
      };
      
      setStaffList(prev => prev.map(s => s.id === staff.id ? updatedStaff : s));
      await db.upsertStaff(updatedStaff);
  };

  const handleTutorAssign = async (studentId: string) => {
      if (!selectedStaffId) return;
      const targetStudent = students.find(s => s.id === studentId);
      if (!targetStudent) return;

      const updatedStudent = { ...targetStudent, tutorId: selectedStaffId };
      setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
      await db.upsertStudent(updatedStudent);
  };

  const autoAssignTutors = async () => {
      if (!selectedStaffId) return;
      const staff = staffList.find(s => s.id === selectedStaffId);
      if (!staff) return;

      const unassigned = students.filter(s => s.department === staff.department && !s.tutorId).slice(0, 5);
      if (unassigned.length === 0) { alert("No unassigned students available."); return; }

      const updatedStudents: Student[] = [];
      const newStudentsList = students.map(s => {
          if (unassigned.find(u => u.id === s.id)) {
              const up = { ...s, tutorId: selectedStaffId };
              updatedStudents.push(up);
              return up;
          }
          return s;
      });

      setStudents(newStudentsList);
      await db.bulkUpsertStudents(updatedStudents);
      alert(`Assigned ${unassigned.length} mentees.`);
  };

  // HOD Curriculum Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setUploadedFile(file);
          if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onloadend = () => setFilePreview(reader.result as string);
              reader.readAsDataURL(file);
          } else {
              setFilePreview(null); // No preview for PDF/Docs
          }
      }
  };

  const processCurriculumFile = async () => {
      if (!uploadedFile || !staffDept) return;
      setIsExtracting(true);
      try {
          let extracted: Course[] = [];
          
          if (uploadedFile.type.startsWith('image/')) {
              // Extract from Image (using existing logic but from file)
              // Need base64 for existing function
               const reader = new FileReader();
               reader.readAsDataURL(uploadedFile);
               await new Promise((resolve) => {
                   reader.onloadend = async () => {
                       const base64 = reader.result as string;
                       extracted = await extractCurriculumFromImage(base64, staffDept);
                       resolve(true);
                   };
               });

          } else if (uploadedFile.type === 'application/pdf') {
              const text = await extractTextFromPDF(uploadedFile);
              extracted = await extractCurriculumFromText(text, staffDept);
          } else if (uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              const text = await extractTextFromDocx(uploadedFile);
              extracted = await extractCurriculumFromText(text, staffDept);
          } else {
              alert("Unsupported file type.");
              setIsExtracting(false);
              return;
          }
          
          setExtractedSubjects(extracted);
      } catch (err) {
          console.error(err);
          alert("Failed to extract data. Ensure the file is readable.");
      } finally {
          setIsExtracting(false);
      }
  };

  const saveExtractedSubjects = async () => {
      if (extractedSubjects.length === 0) return;
      let successCount = 0;
      const newSubjects: Course[] = [];

      for (const sub of extractedSubjects) {
          if (!subjects.find(s => s.code === sub.code)) {
              await db.addSubject(sub);
              newSubjects.push(sub);
              successCount++;
          }
      }
      
      // Optimistic update
      setSubjects(prev => [...prev, ...newSubjects]);
      
      // Background Sync
      const freshSubjects = await db.fetchSubjects();
      setSubjects(freshSubjects);

      setExtractedSubjects([]);
      setUploadedFile(null);
      setFilePreview(null);
      alert(`Added ${successCount} subjects.`);
  };
  
  const handleManualAddSubject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualSubject.code || !manualSubject.name) {
          alert("Course Code and Name are required.");
          return;
      }
      if (!staffDept) {
          alert("Error: Your department is not defined. Ensure you are logged in as HOD/Staff with a valid department.");
          return;
      }
      
      const newSubject = { ...manualSubject, department: staffDept };
      
      // OPTIMISTIC UPDATE: Add to UI immediately
      setSubjects(prev => [...prev, newSubject]);
      
      // Save to DB (Background)
      await db.addSubject(newSubject);
      
      // Re-fetch to ensure sync (optional but good practice)
      const freshSubjects = await db.fetchSubjects();
      setSubjects(freshSubjects);
      
      setManualSubject({ code: '', name: '', credits: 3, semester: 1, department: '', type: 'Theory' });
      alert("Subject added successfully!");
  };

  const deleteSubject = async (code: string) => {
      if(!confirm("Delete this subject?")) return;
      
      // Optimistic Update
      setSubjects(prev => prev.filter(s => s.code !== code));
      
      await db.deleteSubject(code);
  };


  // --- FILTERED LISTS ---
  const myStudents = students.filter(s => {
      if (isHod) return s.department === staffDept; 
      return s.tutorId === currentUser?.id;
  });

  const recordList = isHod 
    ? students.filter(s => s.department === staffDept && (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase())))
    : students.filter(s => s.department === staffDept && (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase())));

  const displaySubjects = React.useMemo(() => {
    if (!student) return [];
    const currentSubjects = subjects.filter(s => s.department === student.department && s.semester === student.currentSemester);
    const merged = currentSubjects.map(sub => ({
        code: sub.code,
        name: sub.name,
        markData: student.marks.find(m => m.code === sub.code),
        isRegistered: !!student.marks.find(m => m.code === sub.code)
    }));
    student.marks.forEach(m => {
        if (!merged.find(d => d.code === m.code)) {
            merged.push({ code: m.code, name: m.name, markData: m, isRegistered: true });
        }
    });
    return merged;
  }, [student, subjects]);


  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-gray-50">
       <div className="bg-white border-b px-6 pt-4 flex gap-6 sticky top-0 z-10">
          <button onClick={() => setActiveTab('attendance')} className={`pb-4 text-sm font-medium transition-colors ${activeTab === 'attendance' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Class Attendance</button>
          <button onClick={() => setActiveTab('records')} className={`pb-4 text-sm font-medium transition-colors ${activeTab === 'records' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Student Records</button>
          {isHod && (
              <button onClick={() => setActiveTab('dept_admin')} className={`pb-4 text-sm font-medium transition-colors ${activeTab === 'dept_admin' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>Dept. Administration</button>
          )}
       </div>
       
       <div className="flex-1 overflow-hidden p-4 md:p-6">
           
           {/* --- ATTENDANCE TAB --- */}
           {activeTab === 'attendance' && (
               <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
                   <div className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-gray-100">
                       <div className="flex-1 space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase">Allocated Subject</label>
                           <select className="w-full border p-2.5 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedClassSubject} onChange={e => { setSelectedClassSubject(e.target.value); setAttendanceLoaded(false); }}>
                               <option value="">Select Subject</option>
                               {currentUser?.allocatedSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                           {currentUser?.allocationStatus === 'pending' && <p className="text-xs text-orange-500 flex items-center gap-1"><AlertCircle size={10}/> Allocations Pending Verification</p>}
                       </div>
                       <div className="flex-1 space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                           <input type="date" className="w-full border p-2.5 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={attendanceDate} onChange={e => { setAttendanceDate(e.target.value); setAttendanceLoaded(false); }} />
                       </div>
                       <div className="flex items-end">
                           <button onClick={loadClassList} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all w-full md:w-auto">Load List</button>
                       </div>
                   </div>

                   {attendanceList.length > 0 && (
                        <div className="flex gap-2 mb-4">
                            <select className="border p-2 rounded text-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                                <option value="">All Depts</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
                            </select>
                            <select className="border p-2 rounded text-sm" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
                                <option value="">All Years</option>
                                <option value="I Year">I Year</option>
                                <option value="II Year">II Year</option>
                                <option value="III Year">III Year</option>
                                <option value="IV Year">IV Year</option>
                            </select>
                            <button onClick={loadClassList} className="text-indigo-600 text-xs font-bold">Apply Filter</button>
                        </div>
                   )}

                   {attendanceLoaded && attendanceList.length > 0 && (
                       <div className="flex-1 overflow-y-auto pr-2">
                            <div className="space-y-2">
                                {attendanceList.map(item => (
                                    <div key={item.id} onClick={() => toggleAttendanceStatus(item.id)} className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${item.status === 'Present' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${item.status === 'Present' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <div className="font-bold text-gray-800">{item.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{item.id}</div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>
                                    </div>
                                ))}
                            </div>
                       </div>
                   )}
                   
                   {attendanceLoaded && attendanceList.length > 0 && (
                        <div className="pt-4 mt-auto border-t border-gray-100">
                             <button onClick={submitBulkAttendance} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"><Save size={18}/> Save Attendance Log</button>
                        </div>
                   )}
               </div>
           )}

           {/* --- RECORDS TAB --- */}
           {activeTab === 'records' && (
               <div className="flex flex-col md:flex-row gap-6 h-full">
                   {/* Sidebar */}
                   <div className="w-full md:w-1/3 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                       <div className="p-4 border-b bg-gray-50 space-y-2">
                           <h3 className="font-bold text-gray-700">Student List</h3>
                           <div className="relative">
                               <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                               <input 
                                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                                  placeholder="Search name or roll no..."
                                  value={searchTerm}
                                  onChange={e => setSearchTerm(e.target.value)}
                               />
                           </div>
                       </div>
                       <div className="flex-1 overflow-y-auto">
                           {recordList.map(s => (
                               <div key={s.id} onClick={() => setSelectedStudentId(s.id)} className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 ${selectedStudentId === s.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}>
                                   <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                       {s.photo ? <img src={s.photo} className="w-full h-full object-cover"/> : <User size={20} className="m-auto mt-2.5 text-gray-500"/>}
                                   </div>
                                   <div>
                                       <div className="font-bold text-sm text-gray-800">{s.name}</div>
                                       <div className="text-xs text-gray-500">{s.id}</div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>

                   {/* Detail View */}
                   <div className="w-full md:w-2/3 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                       {student ? (
                           <>
                            <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-white border p-1 shadow-sm overflow-hidden">
                                        {student.photo ? <img src={student.photo} className="w-full h-full object-cover rounded-lg"/> : <User size={32} className="m-auto mt-4 text-gray-300"/>}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                                        <p className="text-gray-500 text-sm">{student.id} • Sem {student.currentSemester}</p>
                                    </div>
                                </div>
                                <button onClick={() => generateStudentPDF(student)} className="bg-white border p-2 rounded-lg hover:bg-gray-50" title="Download PDF"><Download size={20}/></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Academic Marks</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {displaySubjects.map(sub => (
                                            <div key={sub.code} className={`border p-3 rounded-lg flex justify-between items-center ${currentUser?.allocatedSubjects.includes(sub.code) ? 'bg-white border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                                        {sub.code}
                                                        {sub.markData?.gradeLabel ? <span className={`text-xs px-2 rounded-full ${sub.markData.gradeLabel === 'RA' || sub.markData.gradeLabel === 'U' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Grade: {sub.markData.gradeLabel}</span> : null}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">{sub.name}</div>
                                                </div>
                                                
                                                {(currentUser?.allocatedSubjects.includes(sub.code) || isHod) ? (
                                                     <button onClick={() => initMarksEntry(sub.code, sub.name)} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1"><FileEdit size={12}/> Manage</button>
                                                ) : <span className="text-xs text-gray-400 italic">View Only</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                           </>
                       ) : (
                           <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                               <p>Select a student to view details.</p>
                           </div>
                       )}
                   </div>
               </div>
           )}

           {/* --- HOD DEPT ADMIN TAB --- */}
           {activeTab === 'dept_admin' && isHod && (
               <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                   <div className="border-b px-6 py-3 bg-gray-50 flex gap-4">
                       <button onClick={() => setActiveAdminSubTab('subjects')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeAdminSubTab === 'subjects' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}>Subject Allocation</button>
                       <button onClick={() => setActiveAdminSubTab('tutors')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeAdminSubTab === 'tutors' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}>Tutor Management</button>
                       <button onClick={() => setActiveAdminSubTab('curriculum')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeAdminSubTab === 'curriculum' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}>Curriculum</button>
                   </div>
                   
                   <div className="flex flex-1 overflow-hidden">
                       {/* Sidebar for Staff */}
                       {activeAdminSubTab !== 'curriculum' && (
                           <div className="w-1/3 border-r overflow-y-auto">
                               {staffList.filter(s => s.department === staffDept).map(s => (
                                   <div key={s.id} onClick={() => setSelectedStaffId(s.id)} className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedStaffId === s.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'border-l-4 border-l-transparent'}`}>
                                       <div className="font-bold text-gray-800">{s.name}</div>
                                       <div className="text-xs text-gray-500">{s.email}</div>
                                       <div className="mt-1 flex gap-1">
                                           <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{s.allocatedSubjects.length} Subj</span>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       )}

                       {/* Main Content Area */}
                       <div className={`${activeAdminSubTab === 'curriculum' ? 'w-full' : 'w-2/3'} p-6 overflow-y-auto`}>
                           {activeAdminSubTab === 'curriculum' ? (
                               <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
                                   
                                   {/* LEFT: ADD NEW */}
                                   <div className="w-full md:w-1/2 space-y-6">
                                       <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} className="text-purple-600"/> Add Subjects</h3>
                                       
                                       {/* Manual Add Form */}
                                       <div className="bg-white border rounded-xl p-5 shadow-sm">
                                           <h4 className="text-sm font-bold text-gray-700 mb-3">Manual Entry</h4>
                                           <form onSubmit={handleManualAddSubject} className="space-y-3">
                                               <div className="grid grid-cols-2 gap-3">
                                                   <input placeholder="Code (CS301)" required className="border p-2 rounded text-sm" value={manualSubject.code} onChange={e => setManualSubject({...manualSubject, code: e.target.value.toUpperCase()})} />
                                                   <input placeholder="Credits" type="number" required className="border p-2 rounded text-sm" value={manualSubject.credits} onChange={e => setManualSubject({...manualSubject, credits: Number(e.target.value)})} />
                                               </div>
                                               <input placeholder="Subject Name" required className="border p-2 rounded text-sm w-full" value={manualSubject.name} onChange={e => setManualSubject({...manualSubject, name: e.target.value})} />
                                               <div className="grid grid-cols-2 gap-3">
                                                    <select className="border p-2 rounded text-sm w-full" value={manualSubject.semester} onChange={e => setManualSubject({...manualSubject, semester: Number(e.target.value)})}>
                                                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                                    </select>
                                                    <select className="border p-2 rounded text-sm w-full" value={manualSubject.type} onChange={e => setManualSubject({...manualSubject, type: e.target.value as 'Theory' | 'Lab'})}>
                                                        <option value="Theory">Theory</option>
                                                        <option value="Lab">Lab/Practical</option>
                                                    </select>
                                               </div>
                                               <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-700">Add Subject</button>
                                           </form>
                                       </div>

                                       {/* File Upload Section */}
                                       <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
                                            <input 
                                                type="file" 
                                                id="currUpload" 
                                                className="hidden" 
                                                accept="image/*,.pdf,.docx" 
                                                onChange={handleFileSelect}
                                            />
                                            <label htmlFor="currUpload" className="cursor-pointer flex flex-col items-center justify-center">
                                                {filePreview ? (
                                                    <img src={filePreview} alt="Preview" className="max-h-32 rounded shadow mb-4" />
                                                ) : uploadedFile ? (
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                        <FileText size={32} className="text-purple-500"/>
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                        <Upload size={32} className="text-purple-500"/>
                                                    </div>
                                                )}
                                                <span className="text-sm font-bold text-gray-700">{uploadedFile ? uploadedFile.name : 'Upload Syllabus'}</span>
                                                <span className="text-xs text-gray-400 mt-1">Image, PDF, Word Doc</span>
                                            </label>

                                            {uploadedFile && (
                                                <button 
                                                    onClick={processCurriculumFile} 
                                                    disabled={isExtracting}
                                                    className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 mx-auto text-sm"
                                                >
                                                    {isExtracting ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                                                    {isExtracting ? 'Analyzing...' : 'Extract with AI'}
                                                </button>
                                            )}
                                        </div>

                                        {extractedSubjects.length > 0 && (
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="p-3 border-b bg-green-50 flex justify-between items-center">
                                                    <h4 className="font-bold text-green-800 text-sm">Extracted ({extractedSubjects.length})</h4>
                                                    <button onClick={saveExtractedSubjects} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold hover:bg-green-700">Save All</button>
                                                </div>
                                                <div className="max-h-40 overflow-y-auto">
                                                    {extractedSubjects.map((sub, idx) => (
                                                        <div key={idx} className="p-2 border-b text-xs flex justify-between items-center">
                                                            <span className="font-mono font-bold">{sub.code}</span>
                                                            <span className="truncate flex-1 mx-2">{sub.name} <span className="text-gray-400">({sub.type})</span></span>
                                                            <button onClick={() => setExtractedSubjects(prev => prev.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={12}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                   </div>

                                   {/* RIGHT: CURRENT LIST */}
                                   <div className="w-full md:w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
                                        <div className="p-4 border-b bg-gray-50">
                                            <h3 className="font-bold text-gray-700">Current Department Curriculum</h3>
                                            <p className="text-xs text-gray-400">Subjects available for allocation</p>
                                        </div>
                                        <div className="overflow-y-auto flex-1 p-0">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-white sticky top-0 shadow-sm z-10 text-xs text-gray-500 uppercase">
                                                    <tr><th className="p-3">Code</th><th className="p-3">Subject</th><th className="p-3">Type</th><th className="p-3 text-center">Sem</th><th className="p-3 text-right">Action</th></tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {subjects.filter(s => s.department === staffDept).sort((a,b) => a.semester - b.semester).map(s => (
                                                        <tr key={s.code} className="hover:bg-gray-50">
                                                            <td className="p-3 font-mono font-bold text-gray-700 text-xs">{s.code}</td>
                                                            <td className="p-3 text-xs">{s.name}</td>
                                                            <td className="p-3 text-xs">
                                                                <span className={`px-2 py-0.5 rounded ${s.type === 'Lab' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                    {s.type === 'Lab' ? 'Lab' : 'Theory'}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-center text-xs">{s.semester}</td>
                                                            <td className="p-3 text-right">
                                                                <button onClick={() => deleteSubject(s.code)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {subjects.filter(s => s.department === staffDept).length === 0 && (
                                                        <tr><td colSpan={5} className="p-8 text-center text-gray-400 text-xs">No subjects found. Add some!</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                   </div>
                               </div>
                           ) : selectedStaffId ? (
                               <>
                                {activeAdminSubTab === 'subjects' && (
                                    <div>
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Library size={20} className="text-purple-600"/> Assign Subjects</h3>
                                        <p className="text-sm text-gray-500 mb-4">Managing for: <strong>{staffList.find(s => s.id === selectedStaffId)?.name}</strong></p>
                                        
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Available Subjects ({staffDept})</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
                                                    {subjects.filter(s => s.department === staffDept).map(sub => {
                                                        // Check Allocation Status
                                                        const currentOwner = staffList.find(st => st.allocatedSubjects.includes(sub.code));
                                                        const isMine = currentOwner?.id === selectedStaffId;
                                                        const isOthers = currentOwner && !isMine;
                                                        
                                                        return (
                                                            <div 
                                                                key={sub.code} 
                                                                className={`p-3 rounded-lg border flex justify-between items-center transition-all ${isMine ? 'bg-green-50 border-green-200' : isOthers ? 'bg-orange-50 border-orange-200 opacity-90' : 'bg-white hover:bg-gray-50'}`}
                                                            >
                                                                <div className="overflow-hidden mr-2">
                                                                    <div className="font-bold text-sm truncate" title={sub.name}>{sub.code}</div>
                                                                    <div className="text-xs text-gray-500 truncate">{sub.name}</div>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                         <span className={`text-[9px] px-1.5 py-0.5 rounded ${sub.type === 'Lab' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                            {sub.type || 'Theory'}
                                                                         </span>
                                                                        {isOthers && <span className="text-[10px] text-orange-600 font-bold">Assigned to: {currentOwner.name}</span>}
                                                                    </div>
                                                                </div>
                                                                
                                                                {isMine ? (
                                                                    <button onClick={() => handleSubjectAllocation(sub.code)} className="text-xs bg-white border border-green-200 text-green-700 px-2 py-1 rounded font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                                                                        Remove
                                                                    </button>
                                                                ) : isOthers ? (
                                                                    <button onClick={() => handleSubjectAllocation(sub.code, currentOwner.id)} className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-1 rounded font-bold hover:bg-orange-100 flex items-center gap-1">
                                                                        <ArrowRightLeft size={10}/> Reallocate
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => handleSubjectAllocation(sub.code)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700 shadow-sm">
                                                                        Assign
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeAdminSubTab === 'tutors' && (
                                    <div>
                                        {/* Tutor content remains same as previous */}
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={20} className="text-purple-600"/> Assign Mentees</h3>
                                            <button onClick={autoAssignTutors} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-purple-700">Auto Assign (5 Students)</button>
                                        </div>
                                        
                                        <div className="bg-gray-50 border rounded-xl p-4 mb-4">
                                            <h4 className="font-bold text-sm text-gray-700 mb-2">Unassigned Students in {staffDept}</h4>
                                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                                {students.filter(s => s.department === staffDept && !s.tutorId).map(s => (
                                                    <div key={s.id} className="bg-white p-2 rounded border flex justify-between items-center">
                                                        <span className="text-sm font-medium">{s.name} <span className="text-xs text-gray-400">({s.id})</span></span>
                                                        <button onClick={() => handleTutorAssign(s.id)} className="text-purple-600 hover:bg-purple-50 p-1 rounded"><UserPlus size={16}/></button>
                                                    </div>
                                                ))}
                                                {students.filter(s => s.department === staffDept && !s.tutorId).length === 0 && <p className="text-sm text-gray-400 col-span-2">All students assigned.</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                               </>
                           ) : (
                               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                   <Briefcase size={48} className="mb-4 opacity-20"/>
                                   <p>Select a staff member from the list to manage.</p>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           )}
       </div>

       {/* DETAILED MARKS MODAL */}
       {showMarksModal && currentMarkEntry && (
           <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
               <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative border border-gray-100 animate-slide-up">
                    <button onClick={() => setShowMarksModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    
                    <div className="p-6 border-b bg-gray-50 rounded-t-2xl">
                        <h2 className="text-xl font-bold text-gray-800">Enter Marks</h2>
                        <div className="text-sm text-gray-500 mt-1 flex gap-2">
                            <span className="font-mono bg-white border px-1.5 rounded">{currentMarkEntry.code}</span>
                            <span>{currentMarkEntry.name}</span>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assignment 1 (10)</label>
                                <input type="number" min="0" max="10" className="w-full border p-2.5 rounded-lg text-center font-bold" value={currentMarkEntry.assignment1} onChange={e => setCurrentMarkEntry({...currentMarkEntry, assignment1: Number(e.target.value)})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assignment 2 (10)</label>
                                <input type="number" min="0" max="10" className="w-full border p-2.5 rounded-lg text-center font-bold" value={currentMarkEntry.assignment2} onChange={e => setCurrentMarkEntry({...currentMarkEntry, assignment2: Number(e.target.value)})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal 1 (40)</label>
                                <input type="number" min="0" max="40" className="w-full border p-2.5 rounded-lg text-center font-bold" value={currentMarkEntry.internal1} onChange={e => setCurrentMarkEntry({...currentMarkEntry, internal1: Number(e.target.value)})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal 2 (40)</label>
                                <input type="number" min="0" max="40" className="w-full border p-2.5 rounded-lg text-center font-bold" value={currentMarkEntry.internal2} onChange={e => setCurrentMarkEntry({...currentMarkEntry, internal2: Number(e.target.value)})}/>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semester Exam (100)</label>
                            <input type="number" min="0" max="100" className="w-full border-2 border-indigo-100 p-3 rounded-xl text-center font-bold text-xl text-indigo-700" value={currentMarkEntry.semesterExam} onChange={e => setCurrentMarkEntry({...currentMarkEntry, semesterExam: Number(e.target.value)})}/>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                                Weighted Calculation: (Internal Total * 0.4) + (Semester * 0.6)
                            </p>
                            {['MBA', 'MCA'].includes(student?.department || '') ? 
                                <p className="text-[10px] text-orange-500 text-center mt-1">PG Course: Pass Mark 50 in Semester</p> :
                                <p className="text-[10px] text-blue-500 text-center mt-1">UG Course: Pass Mark 40 in Semester</p>
                            }
                        </div>

                        <button onClick={saveDetailedMarks} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-md transition-all">
                            Calculate & Save Result
                        </button>
                    </div>
               </div>
           </div>
       )}
    </div>
  );
};
