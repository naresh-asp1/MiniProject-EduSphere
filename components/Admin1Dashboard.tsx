import React, { useState, useRef } from 'react';
import { Student, Department, StaffProfile, ChangeRequest, ParentProfile, DEFAULT_CREDS } from '../types';
import { Plus, Trash2, Edit2, Save, X, Building2, Users, UserCog, GitPullRequestArrow, Upload, FileText, Key, UserPlus, Briefcase, User, Camera, Search, Filter, Shield, UserCheck, Crop } from 'lucide-react';
import { ImageCropper } from './ImageCropper';

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
  marks: [],
  attendanceLog: [],
  attendancePercentage: 0,
  backlogs: [],
  performanceReport: '',
  batch: new Date().getFullYear(),
  currentSemester: 1,
  tutorId: '',
  parentId: ''
};

export const Admin1Dashboard: React.FC<Admin1Props> = ({ 
  students, setStudents, 
  departments, setDepartments,
  staffList, setStaffList,
  requests, setRequests,
  parentList, setParentList
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'staff' | 'parents' | 'departments' | 'requests'>('students');
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

  // CROPPER STATE
  const [cropperState, setCropperState] = useState<{
    isOpen: boolean;
    imageSrc: string | null;
    targetType: 'student' | 'staff';
  }>({ isOpen: false, imageSrc: null, targetType: 'student' });

  // --- PHOTO UPLOAD HANDLER ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'student' | 'staff') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              // Instead of setting directly, open the cropper
              setCropperState({
                  isOpen: true,
                  imageSrc: base64String,
                  targetType: type
              });
          };
          reader.readAsDataURL(file);
      }
      // Reset input value to allow re-uploading same file
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


  // --- CSV IMPORT HANDLER ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Expect CSV header: Name,Email,Department,Grade,Section,Contact
        const rows = text.split('\n');
        const dataRows = rows.slice(1).filter(r => r.trim().length > 0);
        
        const newStudents: Student[] = dataRows.map((row, index): Student | null => {
            const cols = row.split(',').map(c => c.trim());
            if (cols.length < 3) return null;

            const batch = new Date().getFullYear();
            const rollNo = `IMP${batch}${index}`;

            return {
                ...EMPTY_STUDENT,
                id: rollNo,
                name: cols[0] || 'Unknown',
                email: cols[1] || `imported.${Date.now()}.${index}@edusphere.edu`,
                department: cols[2] || 'General',
                grade: cols[3] || 'I Year',
                section: cols[4] || 'A',
                contactNumber: cols[5] || '',
                residenceType: 'Day Scholar',
                verified: true,
                marks: [], 
                dob: '2005-01-01',
                address: 'Imported via Bulk Upload',
                batch: batch,
                currentSemester: 1,
                tutorId: '',
                parentId: ''
            };
        }).filter((s): s is Student => s !== null);

        if (newStudents.length > 0) {
            setStudents(prev => [...prev, ...newStudents]);
            alert(`Successfully imported ${newStudents.length} students!\n\nDefault Password: ${DEFAULT_CREDS.STUDENT_PASS}`);
        } else {
            alert("No valid student data found in CSV.");
        }
      } catch (err) {
          console.error(err);
          alert("Failed to parse CSV. Check format.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  // --- AUTO ASSIGN TUTORS (ROUND ROBIN) ---
  const handleAutoAssignTutors = () => {
      const unassigned = students.filter(s => !s.tutorId);
      if (unassigned.length === 0) { 
          alert("No unassigned students found. Everyone has a tutor!"); 
          return; 
      }

      // Group unassigned students by department
      const byDept: Record<string, Student[]> = {};
      unassigned.forEach(s => {
          if(!byDept[s.department]) byDept[s.department] = [];
          byDept[s.department].push(s);
      });

      let updatedCount = 0;
      const newStudents = [...students];

      Object.keys(byDept).forEach(dept => {
          const deptStaff = staffList.filter(st => st.department === dept && !st.isHod); 
          const targetStaff = deptStaff.length > 0 ? deptStaff : staffList.filter(st => st.department === dept); 
          
          if(targetStaff.length === 0) return; 

          const deptStudents = byDept[dept];
          deptStudents.forEach((s, idx) => {
              // Round robin distribution
              const assignedStaff = targetStaff[idx % targetStaff.length];
              const realIndex = newStudents.findIndex(ns => ns.id === s.id);
              if(realIndex !== -1) {
                  newStudents[realIndex] = { ...newStudents[realIndex], tutorId: assignedStaff.id };
                  updatedCount++;
              }
          });
      });
      
      setStudents(newStudents);
      alert(`Successfully split and assigned ${updatedCount} new students to tutors in their respective departments.`);
  };

  // --- STUDENT HANDLERS ---
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setStudents(prev => prev.map(s => s.id === currentStudent.id ? currentStudent : s));
    } else {
      setStudents(prev => [...prev, currentStudent]);
    }
    setShowForm(false);
  };
  
  const initStudentEdit = (student: Student) => {
      setCurrentStudent(student);
      setIsEditing(true);
      setShowForm(true);
  };

  const initStudentAdd = () => {
      const batch = new Date().getFullYear();
      setCurrentStudent({ 
          ...EMPTY_STUDENT, 
          id: `${batch}TMP${Math.floor(Math.random() * 999)}`,
          batch: batch 
      });
      setIsEditing(false);
      setShowForm(true);
  };

  // --- DEPARTMENT HANDLERS ---
  const addDepartment = (e: React.FormEvent) => {
      e.preventDefault();
      const newDept = { id: deptName.substring(0, 3).toUpperCase(), name: deptName };
      setDepartments([...departments, newDept]);
      setDeptName('');
  };

  // --- STAFF HANDLERS ---
  const handleStaffSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Handle ID change based on HOD Status
      let finalId = currentStaff.id;
      if (currentStaff.isHod && !finalId.startsWith('HOD')) {
          finalId = `HOD-${currentStaff.department}`;
      } else if (!currentStaff.isHod && finalId.startsWith('HOD')) {
          finalId = `ST${Math.floor(Math.random() * 1000)}`; // Revert to random ST ID
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
      setShowForm(false);
  };

  const initStaffEdit = (staff: StaffProfile) => {
      setCurrentStaff(staff);
      setIsEditing(true);
      setShowForm(true);
  };

  const initStaffAdd = () => {
      setCurrentStaff({ id: `ST${Math.floor(Math.random() * 1000)}`, name: '', email: '', photo: '', department: departments[0]?.id || '', allocatedSubjects: [], isHod: false, allocationStatus: 'pending' });
      setIsEditing(false);
      setShowForm(true);
  };

  // --- PARENT HANDLERS ---
  const handleParentSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (isEditing) {
          // 1. Update Parent List
          setParentList(prev => prev.map(p => p.id === currentParent.id ? currentParent : p));
          
          // 2. Handle Student Link Update (Remove from old student, add to new student)
          const originalParent = parentList.find(p => p.id === currentParent.id);
          if (originalParent) {
              const oldStudentId = originalParent.studentId;
              const newStudentId = currentParent.studentId;

              if (oldStudentId !== newStudentId) {
                  setStudents(prev => prev.map(s => {
                      // Unlink old student
                      if (s.id === oldStudentId) return { ...s, parentId: undefined };
                      // Link new student
                      if (s.id === newStudentId) return { ...s, parentId: currentParent.id };
                      return s;
                  }));
              } else if (newStudentId) {
                  // Ensure current student has the link (idempotent)
                   setStudents(prev => prev.map(s => s.id === newStudentId ? { ...s, parentId: currentParent.id } : s));
              }
          }
      } else {
          // 1. Add to Parent List
          setParentList(prev => [...prev, currentParent]);
          // 2. Link Student
          if (currentParent.studentId) {
             setStudents(prev => prev.map(s => s.id === currentParent.studentId ? { ...s, parentId: currentParent.id } : s));
          }
      }
      setShowForm(false);
  };

  const initParentAdd = () => {
      setCurrentParent({ id: `P${Math.floor(Math.random() * 10000)}`, name: '', email: '', studentId: '', contactNumber: '' });
      setIsEditing(false);
      setShowForm(true);
  };

  const initParentEdit = (parent: ParentProfile) => {
      setCurrentParent(parent);
      setIsEditing(true);
      setShowForm(true);
  };


  // --- REQUEST HANDLERS ---
  const executeRequest = (req: ChangeRequest) => {
      const studentIndex = students.findIndex(s => s.id === req.studentId);
      if (studentIndex === -1) return;

      const updatedStudents = [...students];
      const student = updatedStudents[studentIndex];

      if (req.field.toLowerCase().includes('name')) student.name = req.newValue;
      else if (req.field.toLowerCase().includes('contact')) student.contactNumber = req.newValue;
      else if (req.field.toLowerCase().includes('address')) student.address = req.newValue;
      else if (req.field.toLowerCase().includes('dob')) student.dob = req.newValue;

      setStudents(updatedStudents);
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
      alert("Data updated and Request marked as Completed.");
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
      
      {/* CROPPER OVERLAY */}
      {cropperState.isOpen && cropperState.imageSrc && (
          <ImageCropper 
              imageSrc={cropperState.imageSrc}
              onCancel={cancelCrop}
              onCropComplete={handleCropComplete}
          />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Administration</h1>
            <p className="text-sm text-gray-500 mt-1">Manage core institutional data, users, and change requests.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
             <button onClick={() => setShowCreds(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-medium shadow-sm">
                <Key size={16} /> <span className="hidden sm:inline">Credentials</span>
            </button>
            <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner">
                {[
                  { id: 'students', label: 'Students', icon: Users },
                  { id: 'staff', label: 'Staff', icon: UserCog },
                  { id: 'parents', label: 'Parents', icon: User },
                  { id: 'departments', label: 'Depts', icon: Building2 },
                  { id: 'requests', label: 'Requests', icon: GitPullRequestArrow }
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                      activeTab === tab.id 
                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                  >
                    <tab.icon size={16} /> <span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
            </div>
        </div>
      </div>

      {/* CONTENT AREAS */}
      
      {/* 1. STUDENTS TAB */}
      {activeTab === 'students' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                     <div className="bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                        Total Students: <span className="text-indigo-600 font-bold ml-1">{students.length}</span>
                     </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <button onClick={handleAutoAssignTutors} className="bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-100 transition-colors text-sm font-semibold" title="Split unassigned students among department staff">
                        <UserPlus size={16} /> Auto-Assign Tutors
                    </button>
                    <button onClick={triggerFileUpload} className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-100 transition-colors text-sm font-semibold">
                        <Upload size={16} /> Import CSV
                    </button>
                    <button onClick={initStudentAdd} className="bg-indigo-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all text-sm font-bold">
                        <Plus size={18} /> Add Student
                    </button>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Profile</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tutor</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Parent</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="p-4">
                                        {s.photo ? (
                                            <img src={s.photo} alt="Student" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-300 border border-indigo-100"><User size={20}/></div>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono text-gray-600 font-medium">{s.id}</td>
                                    <td className="p-4 font-semibold text-gray-800">
                                        {s.name}
                                        <div className="text-[10px] text-gray-400 font-normal">{s.email}</div>
                                    </td>
                                    <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-indigo-100">{s.department}</span></td>
                                    <td className="p-4">
                                        {s.tutorId ? (
                                            <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Assigned
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2 py-1 rounded-full w-fit">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {parentList.find(p => p.studentId === s.id) ? (
                                            <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Linked</span>
                                        ) : <span className="text-gray-400 text-xs italic">Unlinked</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => initStudentEdit(s)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit"><Edit2 size={16}/></button>
                                            <button onClick={() => setStudents(prev => prev.filter(st => st.id !== s.id))} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* STUDENT FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Student Profile' : 'New Student Registration'}</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleStudentSubmit} className="space-y-4">
                            <div className="flex items-center gap-5 mb-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 relative group/photo">
                                <div className="w-20 h-20 rounded-full bg-white overflow-hidden flex items-center justify-center border-4 border-white shadow-sm shrink-0 relative">
                                    {currentStudent.photo ? (
                                        <img src={currentStudent.photo} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={28} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-2">
                                        Student Photo
                                    </label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => handlePhotoUpload(e, 'student')}
                                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Upload to enable cropping tool</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <input placeholder="Full Name" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" value={currentStudent.name} onChange={e => setCurrentStudent({...currentStudent, name: e.target.value})} />
                                <input placeholder="Email Address" type="email" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" value={currentStudent.email} onChange={e => setCurrentStudent({...currentStudent, email: e.target.value})} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Batch</label>
                                    <input type="number" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={currentStudent.batch} onChange={e => setCurrentStudent({...currentStudent, batch: parseInt(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Roll No</label>
                                    <input type="text" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" value={currentStudent.id} onChange={e => setCurrentStudent({...currentStudent, id: e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Department</label>
                                    <select className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" value={currentStudent.department} onChange={e => setCurrentStudent({...currentStudent, department: e.target.value})}>
                                        <option value="">Select Dept</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Residence</label>
                                    <select 
                                        className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" 
                                        value={currentStudent.residenceType} 
                                        onChange={e => setCurrentStudent({...currentStudent, residenceType: e.target.value as 'Hosteller' | 'Day Scholar'})}
                                    >
                                        <option value="Day Scholar">Day Scholar</option>
                                        <option value="Hosteller">Hosteller</option>
                                    </select>
                                </div>
                            </div>

                             {/* Tutor Allocation */}
                             <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">Assign Tutor / Mentor</label>
                                <select 
                                    className="w-full border border-indigo-200 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    value={currentStudent.tutorId || ''}
                                    onChange={e => setCurrentStudent({...currentStudent, tutorId: e.target.value})}
                                >
                                    <option value="">-- Select Tutor (Optional) --</option>
                                    {staffList
                                        .filter(s => currentStudent.department ? s.department === currentStudent.department : true)
                                        .map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                                        ))
                                    }
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Residential Address</label>
                                <textarea 
                                    required 
                                    placeholder="Full Address" 
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[80px]" 
                                    value={currentStudent.address} 
                                    onChange={e => setCurrentStudent({...currentStudent, address: e.target.value})} 
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
          </>
      )}

      {/* 2. STAFF TAB */}
      {activeTab === 'staff' && (
          <>
             <div className="flex justify-end mb-4">
                <button onClick={initStaffAdd} className="bg-indigo-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all text-sm font-bold">
                    <Plus size={18} /> Add Staff
                </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Profile</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID / Code</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dept</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Allocated Subjects</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {staffList.map(s => (
                            <tr key={s.id} className={`hover:bg-gray-50/80 transition-colors group ${s.isHod ? 'bg-purple-50/30' : ''}`}>
                                <td className="p-4">
                                    {s.photo ? (
                                        <img src={s.photo} alt="Staff" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><UserCog size={20}/></div>
                                    )}
                                </td>
                                <td className="p-4 font-mono text-gray-700 font-semibold text-xs">{s.id}</td>
                                <td className="p-4">
                                    <div className="font-semibold text-gray-800">{s.name}</div>
                                    <div className="text-[10px] text-gray-500">{s.email}</div>
                                </td>
                                <td className="p-4"><span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-purple-100">{s.department}</span></td>
                                <td className="p-4">
                                    {s.isHod 
                                        ? <span className="flex items-center gap-1 text-indigo-700 font-bold text-xs bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100"><Briefcase size={12}/> HOD</span>
                                        : <span className="text-gray-500 text-xs font-medium">Staff</span>
                                    }
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {s.allocatedSubjects && s.allocatedSubjects.length > 0 
                                            ? s.allocatedSubjects.map(sub => <span key={sub} className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono border border-gray-200 text-gray-600">{sub}</span>)
                                            : <span className="text-gray-300 italic text-xs">Unassigned</span>
                                        }
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => initStaffEdit(s)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                        <button onClick={() => setStaffList(prev => prev.filter(st => st.id !== s.id))} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* STAFF FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Staff' : 'Add Staff'} Member</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleStaffSubmit} className="space-y-4">
                            <div className="flex items-center gap-5 mb-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="w-20 h-20 rounded-full bg-white overflow-hidden flex items-center justify-center border-4 border-white shadow-sm shrink-0">
                                    {currentStaff.photo ? (
                                        <img src={currentStaff.photo} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={28} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Staff Photo</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => handlePhotoUpload(e, 'staff')}
                                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Upload to enable cropping tool</p>
                                </div>
                            </div>

                            <input placeholder="Name" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={currentStaff.name} onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})} />
                            <input placeholder="Email" type="email" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={currentStaff.email} onChange={e => setCurrentStaff({...currentStaff, email: e.target.value})} />
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign Department</label>
                                <select required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white" value={currentStaff.department} onChange={e => setCurrentStaff({...currentStaff, department: e.target.value})}>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <input 
                                    type="checkbox" 
                                    id="isHod" 
                                    checked={currentStaff.isHod} 
                                    onChange={e => setCurrentStaff({...currentStaff, isHod: e.target.checked})}
                                    className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <div>
                                    <label htmlFor="isHod" className="block text-sm font-bold text-indigo-900">Assign as Head of Department (HOD)</label>
                                    <p className="text-xs text-indigo-700 mt-1 leading-relaxed">This grants administrative access to all student data within the department and updates their ID code format.</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all text-sm">Save Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
          </>
      )}

      {/* 3. PARENTS TAB */}
      {activeTab === 'parents' && (
          <>
             <div className="flex justify-end mb-4">
                <button onClick={initParentAdd} className="bg-indigo-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-all text-sm font-bold"><Plus size={18} /> Add Parent</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Child (Student)</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {parentList.map(p => {
                            const child = students.find(s => s.id === p.studentId);
                            return (
                                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="p-4 font-semibold text-gray-800">{p.name}</td>
                                    <td className="p-4 text-gray-500">{p.email}</td>
                                    <td className="p-4 font-mono text-gray-600">{p.contactNumber}</td>
                                    <td className="p-4">
                                        {child ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                    {child.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 text-xs">{child.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{child.id}</div>
                                                </div>
                                            </div>
                                        ) : <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">Not Linked</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => initParentEdit(p)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                            <button onClick={() => setParentList(prev => prev.filter(pr => pr.id !== p.id))} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {parentList.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-gray-400 italic">No parent accounts created yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* PARENT FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Parent Account' : 'New Parent Account'}</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleParentSubmit} className="space-y-4">
                            <input placeholder="Parent Name" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={currentParent.name} onChange={e => setCurrentParent({...currentParent, name: e.target.value})} />
                            <input placeholder="Email Address" type="email" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={currentParent.email} onChange={e => setCurrentParent({...currentParent, email: e.target.value})} />
                            <input placeholder="Contact Number" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={currentParent.contactNumber} onChange={e => setCurrentParent({...currentParent, contactNumber: e.target.value})} />
                            
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Child (Student)</label>
                                <select 
                                    required 
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white max-h-40" 
                                    value={currentParent.studentId} 
                                    onChange={e => setCurrentParent({...currentParent, studentId: e.target.value})}
                                >
                                    <option value="">-- Select Student --</option>
                                    {[...students].sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.id}) - {s.department}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all text-sm">Save Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
          </>
      )}

      {/* 4. DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Building2 size={24}/></div>
                      <h3 className="font-bold text-lg text-gray-800">Add New Department</h3>
                  </div>
                  <form onSubmit={addDepartment} className="flex gap-3">
                      <input 
                        type="text" 
                        required 
                        placeholder="Department Name" 
                        className="flex-1 border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        value={deptName}
                        onChange={e => setDeptName(e.target.value)}
                      />
                      <button type="submit" className="bg-indigo-600 text-white px-6 rounded-xl hover:bg-indigo-700 font-bold shadow-md transition-all">Add</button>
                  </form>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-6 text-lg">Existing Departments</h3>
                  <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {departments.map(d => (
                          <li key={d.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                              <span className="font-medium text-gray-700">{d.name}</span>
                              <span className="text-xs text-indigo-600 font-mono bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{d.id}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      )}

      {/* 5. REQUESTS TAB */}
      {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-800 text-sm flex items-center gap-2">
                  <AlertFilter size={16} /> <strong>Pending Admin Action:</strong> These requests have been verified by Admin II and await your final database update.
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Field</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">New Value</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {requests.filter(r => r.status === 'pending_admin1').map(r => (
                          <tr key={r.id} className="hover:bg-amber-50/30 transition-colors">
                              <td className="p-4 font-semibold text-gray-800">{r.studentName}</td>
                              <td className="p-4 text-gray-600">{r.field}</td>
                              <td className="p-4 font-mono font-bold text-indigo-600">{r.newValue}</td>
                              <td className="p-4 text-gray-500 italic text-xs">"{r.reason}"</td>
                              <td className="p-4 text-right">
                                  <button 
                                    onClick={() => executeRequest(r)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 ml-auto transition-all"
                                  >
                                      <Save size={14} /> Update Data
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {requests.filter(r => r.status === 'pending_admin1').length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-12 text-center text-gray-400 flex flex-col items-center">
                                  <CheckCircle size={32} className="mb-2 opacity-20"/>
                                  No verified requests pending final action.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      )}

      {/* CREDENTIALS MODAL */}
      {showCreds && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up border border-gray-100">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Key className="text-indigo-600"/> System Credentials</h2>
                      <button onClick={() => setShowCreds(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                          <h3 className="font-bold text-blue-900 mb-3 text-lg">General Login Policy</h3>
                          <p className="text-sm text-blue-800 mb-3 leading-relaxed">
                              All users (Students, Staff, Parents) log in using their registered <strong>Email Address</strong>.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                  <div className="text-xs text-blue-500 font-bold uppercase mb-1">Student Pass</div>
                                  <div className="font-mono text-blue-900 font-bold">{DEFAULT_CREDS.STUDENT_PASS}</div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                  <div className="text-xs text-blue-500 font-bold uppercase mb-1">Staff/HOD Pass</div>
                                  <div className="font-mono text-blue-900 font-bold">{DEFAULT_CREDS.STAFF_PASS}</div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                  <div className="text-xs text-blue-500 font-bold uppercase mb-1">Parent Pass</div>
                                  <div className="font-mono text-blue-900 font-bold">{DEFAULT_CREDS.PARENT_PASS}</div>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                           <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                               <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Shield size={16}/> Admin I (Master)</h4>
                               <div className="space-y-2">
                                   <div className="flex justify-between text-sm">
                                       <span className="text-gray-500">User:</span>
                                       <code className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono font-bold">{DEFAULT_CREDS.ADMIN1.user}</code>
                                   </div>
                                   <div className="flex justify-between text-sm">
                                       <span className="text-gray-500">Pass:</span>
                                       <code className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono font-bold">{DEFAULT_CREDS.ADMIN1.pass}</code>
                                   </div>
                               </div>
                           </div>
                           <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                               <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><UserCheck size={16}/> Admin II (Verifier)</h4>
                               <div className="space-y-2">
                                   <div className="flex justify-between text-sm">
                                       <span className="text-gray-500">User:</span>
                                       <code className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono font-bold">{DEFAULT_CREDS.ADMIN2.user}</code>
                                   </div>
                                   <div className="flex justify-between text-sm">
                                       <span className="text-gray-500">Pass:</span>
                                       <code className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono font-bold">{DEFAULT_CREDS.ADMIN2.pass}</code>
                                   </div>
                               </div>
                           </div>
                      </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                      <button onClick={() => setShowCreds(false)} className="bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-black font-bold shadow-lg transition-all">Close Guide</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// Helper for icon
const AlertFilter = ({size}: {size: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
const CheckCircle = ({size, className}: {size: number, className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
);