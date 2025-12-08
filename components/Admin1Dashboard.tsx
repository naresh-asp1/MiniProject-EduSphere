
import React, { useState, useRef } from 'react';
import { Student, Department, StaffProfile, ChangeRequest, ParentProfile, DEFAULT_CREDS, Course } from '../types';
import { Plus, Trash2, Edit2, Save, X, Building2, Users, UserCog, GitPullRequestArrow, Upload, FileText, Key, UserPlus, Briefcase, User, Camera, Search, Filter, Shield, UserCheck, Crop, CheckCircle, AlertCircle, Banknote, Book, Award, BookOpen, FlaskConical, PenTool } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { db } from '../services/db';

interface Admin1Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  staffList: StaffProfile[];
  setStaffList: React.Dispatch<React.SetStateAction<StaffProfile[]>>;
  requests: ChangeRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChangeRequest[]>>;
  parentList: ParentProfile[];
  setParentList: React.Dispatch<React.SetStateAction<ParentProfile[]>>;
  subjects: Course[];
  setSubjects: React.Dispatch<React.SetStateAction<Course[]>>;
}

const EMPTY_STUDENT: Student = {
  id: '',
  name: '',
  email: '',
  photo: '',
  dob: '',
  grade: '',
  section: '',
  department: '',
  contactNumber: '',
  address: '',
  residenceType: 'Day Scholar',
  verified: false,
  feesPaid: false, 
  marks: [],
  attendanceLog: [],
  attendancePercentage: 0,
  backlogs: [],
  performanceReport: '',
  batch: new Date().getFullYear(),
  currentSemester: 1,
  tutorId: '',
  parentId: '',
  cgpa: 0
};

export const Admin1Dashboard: React.FC<Admin1Props> = ({ 
  students, setStudents, 
  departments, setDepartments,
  staffList, setStaffList,
  requests, setRequests,
  parentList, setParentList,
  subjects, setSubjects
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'staff' | 'parents' | 'departments' | 'requests' | 'curriculum'>('students');
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Student State
  const [currentStudent, setCurrentStudent] = useState<Student>(EMPTY_STUDENT);
  // Department State
  const [deptName, setDeptName] = useState('');
  // Staff State
  const [currentStaff, setCurrentStaff] = useState<StaffProfile>({ id: '', name: '', email: '', photo: '', department: '', allocatedSubjects: [], isHod: false, allocationStatus: 'pending' });
  // Parent State
  const [currentParent, setCurrentParent] = useState<ParentProfile>({ id: '', name: '', email: '', studentId: '', contactNumber: '' });
  // Subject State
  const [currentSubject, setCurrentSubject] = useState<Course>({ code: '', name: '', credits: 3, department: '', semester: 1, type: 'Theory' });

  // CROPPER STATE
  const [cropperState, setCropperState] = useState<{
    isOpen: boolean;
    imageSrc: string | null;
    targetType: 'student' | 'staff';
  }>({ isOpen: false, imageSrc: null, targetType: 'student' });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'student' | 'staff') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setCropperState({
                  isOpen: true,
                  imageSrc: reader.result as string,
                  targetType: type
              });
          };
          reader.readAsDataURL(file);
      }
      e.target.value = '';
  };

  const handleCropComplete = (croppedImage: string) => {
      if (cropperState.targetType === 'student') {
          setCurrentStudent(prev => ({ ...prev, photo: croppedImage }));
      } else {
          setCurrentStaff(prev => ({ ...prev, photo: croppedImage }));
      }
      setCropperState({ isOpen: false, imageSrc: null, targetType: 'student' });
  };

  const cancelCrop = () => {
      setCropperState({ isOpen: false, imageSrc: null, targetType: 'student' });
  };

  // --- HANDLERS ---

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setStudents(prev => prev.map(s => s.id === currentStudent.id ? currentStudent : s));
    } else {
      setStudents(prev => [...prev, currentStudent]);
    }
    await db.upsertStudent(currentStudent);
    setShowForm(false);
  };

  const handleDeleteStudent = async (id: string) => {
      if(!confirm("Are you sure you want to delete this student?")) return;
      setStudents(prev => prev.filter(st => st.id !== id));
      await db.deleteStudent(id);
  };

  const handleAutoAssignTutors = async () => {
      const unassigned = students.filter(s => !s.tutorId);
      if (unassigned.length === 0) { alert("No unassigned students."); return; }

      const byDept: Record<string, Student[]> = {};
      unassigned.forEach(s => {
          if(!byDept[s.department]) byDept[s.department] = [];
          byDept[s.department].push(s);
      });

      const newStudents = [...students];
      const studentsToUpdate: Student[] = [];

      Object.keys(byDept).forEach(dept => {
          const deptStaff = staffList.filter(st => st.department === dept && !st.isHod); 
          const targetStaff = deptStaff.length > 0 ? deptStaff : staffList.filter(st => st.department === dept); 
          if(targetStaff.length === 0) return; 

          byDept[dept].forEach((s, idx) => {
              const assignedStaff = targetStaff[idx % targetStaff.length];
              const realIndex = newStudents.findIndex(ns => ns.id === s.id);
              if(realIndex !== -1) {
                  const updated = { ...newStudents[realIndex], tutorId: assignedStaff.id };
                  newStudents[realIndex] = updated;
                  studentsToUpdate.push(updated);
              }
          });
      });
      
      setStudents(newStudents);
      await db.bulkUpsertStudents(studentsToUpdate);
      alert(`Assigned ${studentsToUpdate.length} students to tutors.`);
  };

  const addDepartment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!deptName) return;
      const newDept = { id: deptName.substring(0, 3).toUpperCase(), name: deptName };
      setDepartments([...departments, newDept]);
      await db.addDepartment(newDept);
      setDeptName('');
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      let finalId = currentStaff.id;
      // Auto-generate ID based on role logic
      if (currentStaff.isHod && !finalId.startsWith('HOD')) {
          finalId = `HOD-${currentStaff.department}`;
      } else if (!currentStaff.isHod && finalId.startsWith('HOD')) {
          finalId = `ST${Math.floor(Math.random() * 1000)}`;
      }

      const staffToSave = {
          ...currentStaff,
          id: finalId,
          allocatedSubjects: isEditing ? currentStaff.allocatedSubjects : []
      };

      if (isEditing) {
          setStaffList(prev => prev.map(s => s.email === currentStaff.email ? staffToSave : s)); 
      } else {
          setStaffList(prev => [...prev, staffToSave]);
      }
      await db.upsertStaff(staffToSave);
      setShowForm(false);
  };

  const handleDeleteStaff = async (id: string) => {
      if(!confirm("Are you sure?")) return;
      setStaffList(prev => prev.filter(st => st.id !== id));
      await db.deleteStaff(id);
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let updatedStudents: Student[] = [];

      if (isEditing) {
          setParentList(prev => prev.map(p => p.id === currentParent.id ? currentParent : p));
          const originalParent = parentList.find(p => p.id === currentParent.id);
          
          if (originalParent) {
              const oldStudentId = originalParent.studentId;
              const newStudentId = currentParent.studentId;

              // If parent changed the child they are linked to
              if (oldStudentId !== newStudentId) {
                 // Unlink old student
                 const oldS = students.find(s => s.id === oldStudentId);
                 if (oldS) {
                     const updatedOld = { ...oldS, parentId: undefined };
                     updatedStudents.push(updatedOld);
                 }
                 // Link new student
                 const newS = students.find(s => s.id === newStudentId);
                 if (newS) {
                     const updatedNew = { ...newS, parentId: currentParent.id };
                     updatedStudents.push(updatedNew);
                 }
              } else if (newStudentId) {
                  // Ensure link exists (idempotent)
                  const s = students.find(s => s.id === newStudentId);
                  if (s && s.parentId !== currentParent.id) {
                      updatedStudents.push({ ...s, parentId: currentParent.id });
                  }
              }
          }
      } else {
          // New Parent
          setParentList(prev => [...prev, currentParent]);
          if (currentParent.studentId) {
             const s = students.find(s => s.id === currentParent.studentId);
             if (s) updatedStudents.push({ ...s, parentId: currentParent.id });
          }
      }

      // Update State & DB
      if (updatedStudents.length > 0) {
          setStudents(prev => prev.map(s => {
              const updated = updatedStudents.find(u => u.id === s.id);
              return updated || s;
          }));
          await db.bulkUpsertStudents(updatedStudents);
      }
      await db.upsertParent(currentParent);
      setShowForm(false);
  };

  const handleDeleteParent = async (id: string) => {
      if(!confirm("Delete this parent record?")) return;
      setParentList(prev => prev.filter(pr => pr.id !== id));
      await db.deleteParent(id);
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      // Since subjects use 'code' as ID, upsert works naturally
      const existing = subjects.find(s => s.code === currentSubject.code);
      if (existing && !confirm("Subject code exists. Update it?")) return;

      if (existing) {
         setSubjects(prev => prev.map(s => s.code === currentSubject.code ? currentSubject : s));
      } else {
         setSubjects(prev => [...prev, currentSubject]);
      }
      await db.addSubject(currentSubject);
      setShowForm(false);
  };

  const handleDeleteSubject = async (code: string) => {
      if(!confirm("Delete this subject?")) return;
      setSubjects(prev => prev.filter(s => s.code !== code));
      await db.deleteSubject(code);
  };

  const executeRequest = async (req: ChangeRequest) => {
      const studentIndex = students.findIndex(s => s.id === req.studentId);
      if (studentIndex === -1) return;

      const student = { ...students[studentIndex] };

      // Apply changes based on field
      if (req.field.toLowerCase().includes('name')) student.name = req.newValue;
      else if (req.field.toLowerCase().includes('contact')) student.contactNumber = req.newValue;
      else if (req.field.toLowerCase().includes('address')) student.address = req.newValue;
      else if (req.field.toLowerCase().includes('dob')) student.dob = req.newValue;

      // Update Student State
      setStudents(prev => prev.map(s => s.id === student.id ? student : s));
      
      // Update Request Status
      const updatedReq = { ...req, status: 'approved' } as ChangeRequest;
      setRequests(prev => prev.map(r => r.id === req.id ? updatedReq : r));
      
      // DB Writes
      await db.upsertStudent(student);
      await db.upsertRequest(updatedReq);
      
      alert("Data updated and Request marked as Completed.");
  };

  // --- UI INITIALIZERS ---
  const initStudentEdit = (student: Student) => { setCurrentStudent(student); setIsEditing(true); setShowForm(true); };
  const initStudentAdd = () => { setCurrentStudent({ ...EMPTY_STUDENT, id: `${new Date().getFullYear()}TMP${Math.floor(Math.random() * 999)}` }); setIsEditing(false); setShowForm(true); };
  
  const initStaffEdit = (staff: StaffProfile) => { setCurrentStaff(staff); setIsEditing(true); setShowForm(true); };
  const initStaffAdd = () => { setCurrentStaff({ id: `ST${Math.floor(Math.random() * 1000)}`, name: '', email: '', photo: '', department: departments[0]?.id || '', allocatedSubjects: [], isHod: false, allocationStatus: 'pending' }); setIsEditing(false); setShowForm(true); };
  
  const initParentEdit = (parent: ParentProfile) => { setCurrentParent(parent); setIsEditing(true); setShowForm(true); };
  const initParentAdd = () => { setCurrentParent({ id: `P${Math.floor(Math.random() * 10000)}`, name: '', email: '', studentId: '', contactNumber: '' }); setIsEditing(false); setShowForm(true); };

  const initSubjectAdd = () => { setCurrentSubject({ code: '', name: '', credits: 3, department: departments[0]?.id || '', semester: 1, type: 'Theory' }); setShowForm(true); };

  // CSV Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(1).filter(r => r.trim().length > 0);
        const newStudents: Student[] = rows.map((row, index): Student | null => {
            const cols = row.split(',').map(c => c.trim());
            if (cols.length < 3) return null;
            return {
                ...EMPTY_STUDENT,
                id: `IMP${Math.floor(Math.random() * 100000)}`,
                name: cols[0] || 'Unknown',
                email: cols[1] || `user${index}@edusphere.edu`,
                department: cols[2] || 'CSE',
                grade: cols[3] || 'I Year',
                verified: true,
                feesPaid: false
            };
        }).filter((s): s is Student => s !== null);

        if (newStudents.length > 0) {
            setStudents(prev => [...prev, ...newStudents]);
            await db.bulkUpsertStudents(newStudents);
            alert(`Imported ${newStudents.length} students.`);
        }
      } catch (err) { alert("Import failed."); }
    };
    reader.readAsText(file);
  };
  
  // Department Split
  const pgDepts = departments.filter(d => ['MBA', 'MCA'].includes(d.id));
  const ugDepts = departments.filter(d => !['MBA', 'MCA'].includes(d.id));


  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
      {cropperState.isOpen && cropperState.imageSrc && (
          <ImageCropper imageSrc={cropperState.imageSrc} onCancel={cancelCrop} onCropComplete={handleCropComplete} />
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Administration</h1>
            <p className="text-sm text-gray-500 mt-1">Manage core institutional data (Supabase Connected).</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
             <button onClick={() => setShowCreds(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium shadow-sm"><Key size={16} /> Creds</button>
            <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner">
                {[{ id: 'students', label: 'Students', icon: Users }, { id: 'staff', label: 'Staff', icon: UserCog }, { id: 'parents', label: 'Parents', icon: User }, { id: 'departments', label: 'Depts', icon: Building2 }, { id: 'curriculum', label: 'Curriculum', icon: Book }, { id: 'requests', label: 'Requests', icon: GitPullRequestArrow }].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}><tab.icon size={16} /> <span className="hidden md:inline">{tab.label}</span></button>
                ))}
            </div>
        </div>
      </div>

      {/* CONTENT: STUDENTS */}
      {activeTab === 'students' && (
          <>
            <div className="flex justify-between items-center gap-4">
                <div className="bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600">Total: <span className="text-indigo-600 font-bold">{students.length}</span></div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <button onClick={handleAutoAssignTutors} className="bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-xl text-sm font-semibold flex gap-2"><UserPlus size={16} /> Auto-Assign</button>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-semibold flex gap-2"><Upload size={16} /> CSV</button>
                    <button onClick={initStudentAdd} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex gap-2"><Plus size={18} /> Add</button>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100"><tr><th className="p-4">Profile</th><th className="p-4">Roll No</th><th className="p-4">Name</th><th className="p-4">Dept</th><th className="p-4">Tutor</th><th className="p-4">Parent</th><th className="p-4">Fees</th><th className="p-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50 group">
                                <td className="p-4">{s.photo ? <img src={s.photo} className="w-10 h-10 rounded-full object-cover"/> : <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center"><User size={20}/></div>}</td>
                                <td className="p-4 font-mono text-gray-600">{s.id}</td>
                                <td className="p-4 font-semibold">{s.name}<div className="text-[10px] text-gray-400 font-normal">{s.email}</div></td>
                                <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs">{s.department}</span></td>
                                <td className="p-4">{s.tutorId ? <span className="text-green-600 text-xs">Assigned</span> : <span className="text-red-500 text-xs">Pending</span>}</td>
                                <td className="p-4">{s.parentId ? <span className="text-green-600 text-xs">Linked</span> : <span className="text-gray-400 text-xs">Unlinked</span>}</td>
                                <td className="p-4">{s.feesPaid ? <span className="text-green-600 font-bold text-xs">Paid</span> : <span className="text-red-500 font-bold text-xs">Unpaid</span>}</td>
                                <td className="p-4 text-right"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => initStudentEdit(s)} className="text-indigo-600"><Edit2 size={16}/></button><button onClick={() => handleDeleteStudent(s.id)} className="text-red-600"><Trash2 size={16}/></button></div></td>
                            </tr>
                        ))}
                        {students.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400">No students found. Add one to get started.</td></tr>}
                    </tbody>
                </table>
            </div>
          </>
      )}

      {/* CONTENT: STAFF */}
      {activeTab === 'staff' && (
          <>
            <div className="flex justify-end mb-4">
                <button onClick={initStaffAdd} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex gap-2"><Plus size={18} /> Add Staff</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100"><tr><th className="p-4">Profile</th><th className="p-4">Staff ID</th><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Dept</th><th className="p-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {staffList.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50 group">
                                <td className="p-4">{s.photo ? <img src={s.photo} className="w-10 h-10 rounded-full object-cover"/> : <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><Briefcase size={20}/></div>}</td>
                                <td className="p-4 font-mono text-gray-600">{s.id}</td>
                                <td className="p-4 font-semibold">{s.name}<div className="text-[10px] text-gray-400 font-normal">{s.email}</div></td>
                                <td className="p-4">{s.isHod ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">HOD</span> : <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Staff</span>}</td>
                                <td className="p-4">{s.department}</td>
                                <td className="p-4 text-right"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => initStaffEdit(s)} className="text-indigo-600"><Edit2 size={16}/></button><button onClick={() => handleDeleteStaff(s.id)} className="text-red-600"><Trash2 size={16}/></button></div></td>
                            </tr>
                        ))}
                        {staffList.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No staff records.</td></tr>}
                    </tbody>
                </table>
            </div>
          </>
      )}

      {/* CONTENT: PARENTS */}
      {activeTab === 'parents' && (
          <>
             <div className="flex justify-end mb-4">
                <button onClick={initParentAdd} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex gap-2"><Plus size={18} /> Add Parent</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100"><tr><th className="p-4">Parent Name</th><th className="p-4">Contact</th><th className="p-4">Child ID</th><th className="p-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {parentList.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 group">
                                <td className="p-4 font-semibold">{p.name}<div className="text-[10px] text-gray-400 font-normal">{p.email}</div></td>
                                <td className="p-4">{p.contactNumber}</td>
                                <td className="p-4 font-mono text-indigo-600">{p.studentId || 'Unlinked'}</td>
                                <td className="p-4 text-right"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => initParentEdit(p)} className="text-indigo-600"><Edit2 size={16}/></button><button onClick={() => handleDeleteParent(p.id)} className="text-red-600"><Trash2 size={16}/></button></div></td>
                            </tr>
                        ))}
                         {parentList.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No parent records.</td></tr>}
                    </tbody>
                </table>
            </div>
          </>
      )}

      {/* CONTENT: DEPARTMENTS */}
      {activeTab === 'departments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* PG DEPARTMENTS */}
              <div className="bg-white rounded-2xl shadow-sm border border-purple-200 p-6">
                  <h2 className="text-lg font-bold mb-4 text-purple-700 flex items-center gap-2"><Award size={18}/> PG Departments (Master's)</h2>
                  <div className="space-y-2 mb-6">
                      {pgDepts.map(d => (
                          <div key={d.id} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <span className="font-semibold text-purple-900">{d.name}</span>
                              <span className="text-xs font-bold text-purple-600 bg-white px-2 py-1 rounded border border-purple-200">{d.id}</span>
                          </div>
                      ))}
                      {pgDepts.length === 0 && <p className="text-gray-400 text-sm">No PG Departments found.</p>}
                  </div>
              </div>

              {/* UG DEPARTMENTS */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2"><BookOpen size={18}/> UG Departments (Bachelor's)</h2>
                  <div className="space-y-2">
                      {ugDepts.map(d => (
                          <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <span className="font-semibold text-gray-700">{d.name}</span>
                              <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{d.id}</span>
                          </div>
                      ))}
                       {ugDepts.length === 0 && <p className="text-gray-400 text-sm">No UG Departments found.</p>}
                  </div>
              </div>

               {/* Add Form */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit md:col-span-2">
                  <h2 className="text-lg font-bold mb-4">Add Department</h2>
                  <form onSubmit={addDepartment} className="flex gap-2">
                      <input 
                        className="flex-1 border p-2 rounded-lg" 
                        placeholder="Department Name" 
                        value={deptName} 
                        onChange={e => setDeptName(e.target.value)} 
                        required
                      />
                      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">Add</button>
                  </form>
              </div>
          </div>
      )}

      {/* CONTENT: CURRICULUM */}
      {activeTab === 'curriculum' && (
          <>
             <div className="flex justify-between mb-4">
                <h2 className="text-lg font-bold">Manage Subjects</h2>
                <button onClick={initSubjectAdd} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex gap-2"><Plus size={18} /> Add Subject</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100"><tr><th className="p-4">Code</th><th className="p-4">Subject Name</th><th className="p-4">Type</th><th className="p-4">Credits</th><th className="p-4">Department</th><th className="p-4">Semester</th><th className="p-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {subjects.sort((a,b) => a.department.localeCompare(b.department) || a.semester - b.semester).map(s => (
                            <tr key={s.code} className="hover:bg-gray-50 group">
                                <td className="p-4 font-mono font-bold text-gray-700">{s.code}</td>
                                <td className="p-4 font-medium">{s.name}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${s.type === 'Lab' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {s.type === 'Lab' ? <FlaskConical size={12} className="inline mr-1"/> : <BookOpen size={12} className="inline mr-1"/>}
                                        {s.type || 'Theory'}
                                    </span>
                                </td>
                                <td className="p-4">{s.credits}</td>
                                <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{s.department}</span></td>
                                <td className="p-4">Sem {s.semester}</td>
                                <td className="p-4 text-right"><button onClick={() => handleDeleteSubject(s.code)} className="text-red-600 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></td>
                            </tr>
                        ))}
                         {subjects.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">No subjects added. Add manually.</td></tr>}
                    </tbody>
                </table>
            </div>
          </>
      )}

      {/* CONTENT: REQUESTS */}
      {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-bold text-gray-700">Pending Execution (Verified by Admin II)</h3>
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-gray-100"><tr><th className="p-4">Student</th><th className="p-4">Field</th><th className="p-4">New Value</th><th className="p-4">Reason</th><th className="p-4 text-right">Action</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                      {requests.filter(r => r.status === 'pending_admin1').map(r => (
                          <tr key={r.id} className="hover:bg-gray-50">
                              <td className="p-4 font-semibold">{r.studentName}</td>
                              <td className="p-4">{r.field}</td>
                              <td className="p-4 text-green-600 font-medium">{r.newValue}</td>
                              <td className="p-4 text-gray-500 italic">"{r.reason}"</td>
                              <td className="p-4 text-right">
                                  <button onClick={() => executeRequest(r)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 ml-auto">
                                      <GitPullRequestArrow size={14}/> Execute Update
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {requests.filter(r => r.status === 'pending_admin1').length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-400">No requests pending execution.</td></tr>
                      )}
                  </tbody>
              </table>

              <div className="p-4 bg-gray-50 border-b border-gray-100 border-t mt-4">
                  <h3 className="font-bold text-gray-700">Request History</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-gray-100 opacity-60">
                        {requests.filter(r => r.status === 'approved' || r.status === 'rejected').map(r => (
                            <tr key={r.id}>
                                <td className="p-4">{r.studentName}</td>
                                <td className="p-4">{r.field}</td>
                                <td className="p-4">{r.newValue}</td>
                                <td className="p-4 text-right uppercase text-xs font-bold">
                                    {r.status === 'approved' ? <span className="text-green-600">Completed</span> : <span className="text-red-600">Rejected</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}
      
      {/* MODALS */}
      {/* 1. CREDENTIALS MODAL */}
      {showCreds && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl relative">
                <button onClick={() => setShowCreds(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                <h2 className="text-2xl font-bold mb-2">System Credentials</h2>
                <p className="mb-6 text-gray-500 text-sm">Use these to access different modules. Data persists in your connected DB.</p>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium">Admin I (Main)</span>
                        <span className="font-mono text-gray-600">{DEFAULT_CREDS.ADMIN1.user} / {DEFAULT_CREDS.ADMIN1.pass}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium">Admin II (Verifier)</span>
                        <span className="font-mono text-gray-600">{DEFAULT_CREDS.ADMIN2.user} / {DEFAULT_CREDS.ADMIN2.pass}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-medium">Staff / HOD</span>
                        <span className="font-mono text-gray-600">[Email] / {DEFAULT_CREDS.STAFF_PASS}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Student</span>
                        <span className="font-mono text-gray-600">[Email] / {DEFAULT_CREDS.STUDENT_PASS}</span>
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* 2. STUDENT FORM MODAL */}
      {showForm && activeTab === 'students' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEditing ? 'Edit' : 'Add'} Student</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                 </div>
                 
                 <form onSubmit={handleStudentSubmit} className="space-y-4">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border">
                             {currentStudent.photo ? <img src={currentStudent.photo} className="w-full h-full object-cover"/> : <User size={32} className="text-gray-400"/>}
                        </div>
                        <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                            Upload Photo
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'student')}/>
                        </label>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Full Name" required className="border p-2.5 rounded-lg w-full" value={currentStudent.name} onChange={e => setCurrentStudent({...currentStudent, name: e.target.value})} />
                        <input placeholder="Roll Number" required className="border p-2.5 rounded-lg w-full" value={currentStudent.id} onChange={e => setCurrentStudent({...currentStudent, id: e.target.value})} />
                        <input placeholder="Email Address" type="email" required className="border p-2.5 rounded-lg w-full" value={currentStudent.email} onChange={e => setCurrentStudent({...currentStudent, email: e.target.value})} />
                        <input placeholder="Contact Number" required className="border p-2.5 rounded-lg w-full" value={currentStudent.contactNumber} onChange={e => setCurrentStudent({...currentStudent, contactNumber: e.target.value})} />
                        
                        <select className="border p-2.5 rounded-lg w-full" value={currentStudent.department} onChange={e => setCurrentStudent({...currentStudent, department: e.target.value})}>
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        
                        <select className="border p-2.5 rounded-lg w-full" value={currentStudent.grade} onChange={e => setCurrentStudent({...currentStudent, grade: e.target.value})}>
                            <option value="I Year">I Year</option>
                            <option value="II Year">II Year</option>
                            <option value="III Year">III Year</option>
                            <option value="IV Year">IV Year</option>
                        </select>

                        <select className="border p-2.5 rounded-lg w-full" value={currentStudent.residenceType} onChange={e => setCurrentStudent({...currentStudent, residenceType: e.target.value as any})}>
                            <option value="Day Scholar">Day Scholar</option>
                            <option value="Hosteller">Hosteller</option>
                        </select>
                        
                        <div className="border p-2.5 rounded-lg w-full bg-gray-50">
                            <span className="text-xs text-gray-400 block mb-1">Assigned Tutor</span>
                            <select className="w-full bg-transparent outline-none" value={currentStudent.tutorId || ''} onChange={e => setCurrentStudent({...currentStudent, tutorId: e.target.value})}>
                                <option value="">No Tutor Assigned</option>
                                {staffList.filter(s => s.department === currentStudent.department).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                         <input 
                            type="checkbox" 
                            id="feesPaid" 
                            checked={currentStudent.feesPaid} 
                            onChange={e => setCurrentStudent({...currentStudent, feesPaid: e.target.checked})} 
                            className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                        />
                         <label htmlFor="feesPaid" className="text-sm font-bold text-yellow-900 flex items-center gap-2"><Banknote size={16}/> Mark Fees as Paid</label>
                     </div>

                     <textarea placeholder="Residential Address" className="border p-2.5 rounded-lg w-full h-20" value={currentStudent.address} onChange={e => setCurrentStudent({...currentStudent, address: e.target.value})} />

                     <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md">Save Student</button>
                     </div>
                 </form>
              </div>
          </div>
      )}

      {/* 3. STAFF FORM MODAL */}
      {showForm && activeTab === 'staff' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEditing ? 'Edit' : 'Add'} Staff Member</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                 </div>
                 
                 <form onSubmit={handleStaffSubmit} className="space-y-4">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border">
                             {currentStaff.photo ? <img src={currentStaff.photo} className="w-full h-full object-cover"/> : <Briefcase size={28} className="text-gray-400"/>}
                        </div>
                        <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                            Upload Photo
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'staff')}/>
                        </label>
                     </div>

                     <input placeholder="Full Name" required className="border p-2.5 rounded-lg w-full" value={currentStaff.name} onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})} />
                     <input placeholder="Email Address" type="email" required className="border p-2.5 rounded-lg w-full" value={currentStaff.email} onChange={e => setCurrentStaff({...currentStaff, email: e.target.value})} />
                     
                     <select className="border p-2.5 rounded-lg w-full" value={currentStaff.department} onChange={e => setCurrentStaff({...currentStaff, department: e.target.value})} required>
                         {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                     </select>
                     
                     <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                         <input 
                            type="checkbox" 
                            id="isHod" 
                            checked={currentStaff.isHod} 
                            onChange={e => setCurrentStaff({...currentStaff, isHod: e.target.checked})} 
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                         <label htmlFor="isHod" className="text-sm font-bold text-purple-900">Assign as Head of Department (HOD)</label>
                     </div>

                     <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md">Save Staff</button>
                     </div>
                 </form>
              </div>
          </div>
      )}

      {/* 4. PARENT FORM MODAL */}
      {showForm && activeTab === 'parents' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEditing ? 'Edit' : 'Add'} Parent</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                 </div>
                 
                 <form onSubmit={handleParentSubmit} className="space-y-4">
                     <input placeholder="Parent Name" required className="border p-2.5 rounded-lg w-full" value={currentParent.name} onChange={e => setCurrentParent({...currentParent, name: e.target.value})} />
                     <input placeholder="Email Address" type="email" required className="border p-2.5 rounded-lg w-full" value={currentParent.email} onChange={e => setCurrentParent({...currentParent, email: e.target.value})} />
                     <input placeholder="Contact Number" required className="border p-2.5 rounded-lg w-full" value={currentParent.contactNumber} onChange={e => setCurrentParent({...currentParent, contactNumber: e.target.value})} />
                     
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Link Student</label>
                        <select 
                            className="border p-2.5 rounded-lg w-full" 
                            value={currentParent.studentId} 
                            onChange={e => setCurrentParent({...currentParent, studentId: e.target.value})}
                        >
                            <option value="">Select Child</option>
                            {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400">Linking will grant this parent access to the selected student's data.</p>
                     </div>

                     <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md">Save Parent</button>
                     </div>
                 </form>
              </div>
          </div>
      )}

      {/* 5. SUBJECT FORM MODAL */}
      {showForm && activeTab === 'curriculum' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Add Subject</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                 </div>
                 
                 <form onSubmit={handleSubjectSubmit} className="space-y-4">
                     <input placeholder="Course Code (e.g., CS3301)" required className="border p-2.5 rounded-lg w-full uppercase" value={currentSubject.code} onChange={e => setCurrentSubject({...currentSubject, code: e.target.value.toUpperCase()})} />
                     <input placeholder="Subject Name" required className="border p-2.5 rounded-lg w-full" value={currentSubject.name} onChange={e => setCurrentSubject({...currentSubject, name: e.target.value})} />
                     <div className="grid grid-cols-2 gap-3">
                         <input type="number" placeholder="Credits" required className="border p-2.5 rounded-lg w-full" value={currentSubject.credits} onChange={e => setCurrentSubject({...currentSubject, credits: Number(e.target.value)})} />
                         <select className="border p-2.5 rounded-lg w-full" value={currentSubject.type} onChange={e => setCurrentSubject({...currentSubject, type: e.target.value as 'Theory' | 'Lab'})} required>
                             <option value="Theory">Theory</option>
                             <option value="Lab">Lab/Practical</option>
                         </select>
                     </div>
                     
                     <select className="border p-2.5 rounded-lg w-full" value={currentSubject.department} onChange={e => setCurrentSubject({...currentSubject, department: e.target.value})} required>
                         <option value="">Select Department</option>
                         {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                     </select>
                     
                     <select className="border p-2.5 rounded-lg w-full" value={currentSubject.semester} onChange={e => setCurrentSubject({...currentSubject, semester: Number(e.target.value)})} required>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                     </select>

                     <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md">Save Subject</button>
                     </div>
                 </form>
              </div>
          </div>
      )}
    </div>
  );
};
