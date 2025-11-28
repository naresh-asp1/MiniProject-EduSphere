
import React, { useState, useRef } from 'react';
import { Student, Department, StaffProfile, ChangeRequest, ParentProfile, DEFAULT_CREDS } from '../types';
import { Plus, Trash2, Edit2, Save, X, Building2, Users, UserCog, GitPullRequestArrow, Upload, FileText, Key, UserPlus, Briefcase, User } from 'lucide-react';

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
  const [currentStaff, setCurrentStaff] = useState<StaffProfile>({ id: '', name: '', email: '', department: '', allocatedSubjects: [], isHod: false, allocationStatus: 'pending' });

  // Parent State
  const [currentParent, setCurrentParent] = useState<ParentProfile>({ id: '', name: '', email: '', studentId: '', contactNumber: '' });

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
      setCurrentStaff({ id: `ST${Math.floor(Math.random() * 1000)}`, name: '', email: '', department: departments[0]?.id || '', allocatedSubjects: [], isHod: false, allocationStatus: 'pending' });
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
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">System Administration (Admin I)</h1>
            <p className="text-gray-500">Manage core data and finalize requests.</p>
        </div>
        
        <div className="flex items-center gap-2">
             <button onClick={() => setShowCreds(true)} className="bg-white border border-gray-300 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium">
                <Key size={16} /> Credentials Guide
            </button>
            <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <button onClick={() => setActiveTab('students')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'students' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Users size={16} /> Students
                </button>
                <button onClick={() => setActiveTab('staff')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'staff' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <UserCog size={16} /> Staff
                </button>
                <button onClick={() => setActiveTab('parents')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'parents' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <User size={16} /> Parents
                </button>
                <button onClick={() => setActiveTab('departments')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'departments' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Building2 size={16} /> Depts
                </button>
                <button onClick={() => setActiveTab('requests')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === 'requests' ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <GitPullRequestArrow size={16} /> Requests
                </button>
            </div>
        </div>
      </div>

      {/* CONTENT AREAS */}
      
      {/* 1. STUDENTS TAB */}
      {activeTab === 'students' && (
          <>
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-500">Total Students: {students.length}</div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <button onClick={handleAutoAssignTutors} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 text-sm font-medium" title="Split unassigned students among department staff">
                        <UserPlus size={16} /> Auto-Assign Tutors
                    </button>
                    <button onClick={triggerFileUpload} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm font-medium">
                        <Upload size={16} /> Import CSV
                    </button>
                    <button onClick={initStudentAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 text-sm font-medium">
                        <Plus size={16} /> Add Student
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Tutor Status</th>
                                <th className="p-4">Parent Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-mono">{s.id}</td>
                                    <td className="p-4 font-medium">{s.name}</td>
                                    <td className="p-4 text-gray-500">{s.email}</td>
                                    <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{s.department}</span></td>
                                    <td className="p-4">
                                        {s.tutorId ? (
                                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono border border-green-200">{s.tutorId}</span>
                                        ) : (
                                            <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {parentList.find(p => p.studentId === s.id) ? (
                                            <span className="text-green-600 text-xs font-bold">Linked</span>
                                        ) : <span className="text-gray-400 text-xs">No Parent</span>}
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => initStudentEdit(s)} className="text-blue-600 hover:underline mr-3">Edit</button>
                                        <button onClick={() => setStudents(prev => prev.filter(st => st.id !== s.id))} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* STUDENT FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Student' : 'Add Student'}</h2>
                        <form onSubmit={handleStudentSubmit} className="space-y-3">
                            <input placeholder="Name" required className="w-full border p-2 rounded" value={currentStudent.name} onChange={e => setCurrentStudent({...currentStudent, name: e.target.value})} />
                            <input placeholder="Email" type="email" required className="w-full border p-2 rounded" value={currentStudent.email} onChange={e => setCurrentStudent({...currentStudent, email: e.target.value})} />
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Batch (Join Year)</label>
                                    <input type="number" className="w-full border p-2 rounded" value={currentStudent.batch} onChange={e => setCurrentStudent({...currentStudent, batch: parseInt(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Roll No</label>
                                    <input type="text" className="w-full border p-2 rounded" value={currentStudent.id} onChange={e => setCurrentStudent({...currentStudent, id: e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Department</label>
                                    <select className="w-full border p-2 rounded" value={currentStudent.department} onChange={e => setCurrentStudent({...currentStudent, department: e.target.value})}>
                                        <option value="">Select Dept</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Residence</label>
                                    <select 
                                        className="w-full border p-2 rounded" 
                                        value={currentStudent.residenceType} 
                                        onChange={e => setCurrentStudent({...currentStudent, residenceType: e.target.value as 'Hosteller' | 'Day Scholar'})}
                                    >
                                        <option value="Day Scholar">Day Scholar</option>
                                        <option value="Hosteller">Hosteller</option>
                                    </select>
                                </div>
                            </div>

                             {/* Tutor Allocation */}
                             <div>
                                <label className="block text-xs font-bold text-indigo-600 mb-1">Assign Tutor / Mentor</label>
                                <select 
                                    className="w-full border p-2 rounded bg-indigo-50 border-indigo-200"
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
                            
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Residential Address</label>
                                <textarea 
                                    required 
                                    placeholder="Full Address" 
                                    className="w-full border p-2 rounded h-20 text-sm" 
                                    value={currentStudent.address} 
                                    onChange={e => setCurrentStudent({...currentStudent, address: e.target.value})} 
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
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
                <button onClick={initStaffAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"><Plus size={16} /> Add Staff</button>
            </div>
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID / Code</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Dept</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Allocated Subjects</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map(s => (
                            <tr key={s.id} className={`border-b last:border-0 hover:bg-gray-50 ${s.isHod ? 'bg-indigo-50/50' : ''}`}>
                                <td className="p-4 font-mono text-gray-700 font-bold">{s.id}</td>
                                <td className="p-4 font-medium">{s.name}</td>
                                <td className="p-4 text-gray-500">{s.email}</td>
                                <td className="p-4"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">{s.department}</span></td>
                                <td className="p-4">
                                    {s.isHod 
                                        ? <span className="flex items-center gap-1 text-indigo-700 font-bold text-xs"><Briefcase size={12}/> Head of Dept</span>
                                        : <span className="text-gray-500 text-xs">Staff</span>
                                    }
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {s.allocatedSubjects && s.allocatedSubjects.length > 0 
                                            ? s.allocatedSubjects.map(sub => <span key={sub} className="bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">{sub}</span>)
                                            : <span className="text-gray-400 italic text-xs">Unassigned</span>
                                        }
                                    </div>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <button onClick={() => initStaffEdit(s)} className="text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => setStaffList(prev => prev.filter(st => st.id !== s.id))} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* STAFF FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Staff' : 'Add Staff'} Member</h2>
                        <form onSubmit={handleStaffSubmit} className="space-y-3">
                            <input placeholder="Name" required className="w-full border p-2 rounded" value={currentStaff.name} onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})} />
                            <input placeholder="Email" type="email" required className="w-full border p-2 rounded" value={currentStaff.email} onChange={e => setCurrentStaff({...currentStaff, email: e.target.value})} />
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Assign Department</label>
                                <select required className="w-full border p-2 rounded" value={currentStaff.department} onChange={e => setCurrentStaff({...currentStaff, department: e.target.value})}>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                                <input 
                                    type="checkbox" 
                                    id="isHod" 
                                    checked={currentStaff.isHod} 
                                    onChange={e => setCurrentStaff({...currentStaff, isHod: e.target.checked})}
                                    className="w-5 h-5 text-indigo-600"
                                />
                                <div>
                                    <label htmlFor="isHod" className="block text-sm font-bold text-indigo-900">Assign as Head of Department (HOD)</label>
                                    <p className="text-xs text-gray-500">This will grant access to all student data in the department and change ID code.</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
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
                <button onClick={initParentAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"><Plus size={16} /> Add Parent</button>
            </div>
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Child (Student)</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parentList.map(p => {
                            const child = students.find(s => s.id === p.studentId);
                            return (
                                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-medium">{p.name}</td>
                                    <td className="p-4 text-gray-500">{p.email}</td>
                                    <td className="p-4">{p.contactNumber}</td>
                                    <td className="p-4">
                                        {child ? (
                                            <div>
                                                <div className="font-bold text-indigo-600">{child.name}</div>
                                                <div className="text-xs text-gray-400 font-mono">{child.id}</div>
                                            </div>
                                        ) : <span className="text-red-500 italic">Not Linked</span>}
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => initParentEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => setParentList(prev => prev.filter(pr => pr.id !== p.id))} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            );
                        })}
                        {parentList.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No parents added.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* PARENT FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Parent' : 'Add Parent'}</h2>
                        <form onSubmit={handleParentSubmit} className="space-y-3">
                            <input placeholder="Parent Name" required className="w-full border p-2 rounded" value={currentParent.name} onChange={e => setCurrentParent({...currentParent, name: e.target.value})} />
                            <input placeholder="Email Address" type="email" required className="w-full border p-2 rounded" value={currentParent.email} onChange={e => setCurrentParent({...currentParent, email: e.target.value})} />
                            <input placeholder="Contact Number" required className="w-full border p-2 rounded" value={currentParent.contactNumber} onChange={e => setCurrentParent({...currentParent, contactNumber: e.target.value})} />
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Select Child (Student)</label>
                                <select 
                                    required 
                                    className="w-full border p-2 rounded max-h-40" 
                                    value={currentParent.studentId} 
                                    onChange={e => setCurrentParent({...currentParent, studentId: e.target.value})}
                                >
                                    <option value="">-- Select Student --</option>
                                    {[...students].sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.id}) - {s.department}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
          </>
      )}

      {/* 4. DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                  <h3 className="font-bold text-gray-700 mb-4">Add New Department</h3>
                  <form onSubmit={addDepartment} className="flex gap-2">
                      <input 
                        type="text" 
                        required 
                        placeholder="Department Name" 
                        className="flex-1 border p-2 rounded" 
                        value={deptName}
                        onChange={e => setDeptName(e.target.value)}
                      />
                      <button type="submit" className="bg-indigo-600 text-white px-4 rounded hover:bg-indigo-700">Add</button>
                  </form>
              </div>
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                  <h3 className="font-bold text-gray-700 mb-4">Existing Departments</h3>
                  <ul className="space-y-2">
                      {departments.map(d => (
                          <li key={d.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span>{d.name}</span>
                              <span className="text-xs text-gray-400 font-mono">{d.id}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      )}

      {/* 5. REQUESTS TAB */}
      {activeTab === 'requests' && (
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-800 text-sm">
                  <strong>Pending Admin Action:</strong> These requests have been verified by Admin II and are waiting for you to update the database.
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                      <tr>
                          <th className="p-4">Student</th>
                          <th className="p-4">Field</th>
                          <th className="p-4">New Value</th>
                          <th className="p-4">Reason</th>
                          <th className="p-4">Action</th>
                      </tr>
                  </thead>
                  <tbody>
                      {requests.filter(r => r.status === 'pending_admin1').map(r => (
                          <tr key={r.id} className="border-b hover:bg-amber-50/50">
                              <td className="p-4 font-medium">{r.studentName}</td>
                              <td className="p-4">{r.field}</td>
                              <td className="p-4 font-bold text-indigo-600">{r.newValue}</td>
                              <td className="p-4 text-gray-500 italic">"{r.reason}"</td>
                              <td className="p-4">
                                  <button 
                                    onClick={() => executeRequest(r)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1"
                                  >
                                      <Save size={14} /> Update Data
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {requests.filter(r => r.status === 'pending_admin1').length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-400">No verified requests pending action.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      )}

      {/* CREDENTIALS MODAL */}
      {showCreds && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-xl w-full max-w-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">System Access Credentials</h2>
                      <button onClick={() => setShowCreds(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <h3 className="font-bold text-blue-900 mb-2">Student, Parent & Staff Login Policy</h3>
                          <p className="text-sm text-blue-800 mb-2">
                              Login uses <strong>Email Address</strong> as Username.
                          </p>
                          <ul className="list-disc list-inside text-sm text-blue-800 font-mono">
                              <li>Student Password: <strong>{DEFAULT_CREDS.STUDENT_PASS}</strong></li>
                              <li>Staff/HOD Password: <strong>{DEFAULT_CREDS.STAFF_PASS}</strong></li>
                              <li>Parent Password: <strong>{DEFAULT_CREDS.PARENT_PASS}</strong></li>
                          </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 border rounded-lg">
                               <h4 className="font-bold text-gray-700">Admin I (Master)</h4>
                               <div className="text-sm mt-2">
                                   User: <code className="bg-gray-100 px-1 rounded">{DEFAULT_CREDS.ADMIN1.user}</code><br/>
                                   Pass: <code className="bg-gray-100 px-1 rounded">{DEFAULT_CREDS.ADMIN1.pass}</code>
                               </div>
                           </div>
                           <div className="p-4 border rounded-lg">
                               <h4 className="font-bold text-gray-700">Admin II (Verifier)</h4>
                               <div className="text-sm mt-2">
                                   User: <code className="bg-gray-100 px-1 rounded">{DEFAULT_CREDS.ADMIN2.user}</code><br/>
                                   Pass: <code className="bg-gray-100 px-1 rounded">{DEFAULT_CREDS.ADMIN2.pass}</code>
                               </div>
                           </div>
                      </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                      <button onClick={() => setShowCreds(false)} className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900">Close Guide</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
