import React, { useState } from 'react';
import { Student, Department, StaffProfile, Marks, ChangeRequest } from '../types';
import { Plus, Trash2, Edit2, Save, X, Building2, Users, UserCog, GitPullRequestArrow } from 'lucide-react';

interface Admin1Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  staffList: StaffProfile[];
  setStaffList: React.Dispatch<React.SetStateAction<StaffProfile[]>>;
  requests: ChangeRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChangeRequest[]>>;
}

const EMPTY_MARKS: Marks = { math: 0, science: 0, english: 0, history: 0, computer: 0 };
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
  verified: false,
  marks: EMPTY_MARKS,
  attendanceLog: [],
  attendancePercentage: 0,
  backlogs: [],
  performanceReport: ''
};

export const Admin1Dashboard: React.FC<Admin1Props> = ({ 
  students, setStudents, 
  departments, setDepartments,
  staffList, setStaffList,
  requests, setRequests
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'staff' | 'departments' | 'requests'>('students');
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Student State
  const [currentStudent, setCurrentStudent] = useState<Student>(EMPTY_STUDENT);

  // Department State
  const [deptName, setDeptName] = useState('');
  
  // Staff State
  const [currentStaff, setCurrentStaff] = useState<StaffProfile>({ id: '', name: '', email: '', department: '' });

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
      setCurrentStudent({ ...EMPTY_STUDENT, id: `S${Math.floor(Math.random() * 10000)}` });
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
      if (isEditing) {
          setStaffList(prev => prev.map(s => s.id === currentStaff.id ? currentStaff : s));
      } else {
          setStaffList(prev => [...prev, currentStaff]);
      }
      setShowForm(false);
  };

  const initStaffAdd = () => {
      setCurrentStaff({ id: `ST${Math.floor(Math.random() * 1000)}`, name: '', email: '', department: departments[0]?.id || '' });
      setIsEditing(false);
      setShowForm(true);
  };

  // --- REQUEST HANDLERS ---
  const executeRequest = (req: ChangeRequest) => {
      // Update actual student data
      const studentIndex = students.findIndex(s => s.id === req.studentId);
      if (studentIndex === -1) return;

      const updatedStudents = [...students];
      const student = updatedStudents[studentIndex];

      // Map field names to keys (Simple mapping for demo)
      if (req.field.toLowerCase().includes('name')) student.name = req.newValue;
      else if (req.field.toLowerCase().includes('contact')) student.contactNumber = req.newValue;
      else if (req.field.toLowerCase().includes('address')) student.address = req.newValue;
      else if (req.field.toLowerCase().includes('dob')) student.dob = req.newValue;

      setStudents(updatedStudents);

      // Update Request Status
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
        
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
            <button onClick={() => setActiveTab('students')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'students' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Users size={16} /> Students
            </button>
            <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'staff' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <UserCog size={16} /> Staff
            </button>
            <button onClick={() => setActiveTab('departments')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'departments' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Building2 size={16} /> Depts
            </button>
            <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'requests' ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <GitPullRequestArrow size={16} /> Requests
            </button>
        </div>
      </div>

      {/* CONTENT AREAS */}
      
      {/* 1. STUDENTS TAB */}
      {activeTab === 'students' && (
          <>
            <div className="flex justify-end mb-4">
                <button onClick={initStudentAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"><Plus size={16} /> Add Student</button>
            </div>
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Department</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-mono">{s.id}</td>
                                <td className="p-4">{s.name}</td>
                                <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{s.department}</span></td>
                                <td className="p-4">
                                    <button onClick={() => initStudentEdit(s)} className="text-blue-600 hover:underline mr-3">Edit</button>
                                    <button onClick={() => setStudents(prev => prev.filter(st => st.id !== s.id))} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* STUDENT FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Student' : 'Add Student'}</h2>
                        <form onSubmit={handleStudentSubmit} className="space-y-3">
                            <input placeholder="Name" required className="w-full border p-2 rounded" value={currentStudent.name} onChange={e => setCurrentStudent({...currentStudent, name: e.target.value})} />
                            <input placeholder="Email" type="email" required className="w-full border p-2 rounded" value={currentStudent.email} onChange={e => setCurrentStudent({...currentStudent, email: e.target.value})} />
                            <div className="grid grid-cols-2 gap-3">
                                <input placeholder="Grade" className="w-full border p-2 rounded" value={currentStudent.grade} onChange={e => setCurrentStudent({...currentStudent, grade: e.target.value})} />
                                <select className="w-full border p-2 rounded" value={currentStudent.department} onChange={e => setCurrentStudent({...currentStudent, department: e.target.value})}>
                                    <option value="">Select Dept</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
                            <th className="p-4">ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Assigned Department</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map(s => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-mono">{s.id}</td>
                                <td className="p-4">{s.name}</td>
                                <td className="p-4"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">{s.department}</span></td>
                                <td className="p-4">
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
                        <h2 className="text-xl font-bold mb-4">Add Staff Member</h2>
                        <form onSubmit={handleStaffSubmit} className="space-y-3">
                            <input placeholder="Name" required className="w-full border p-2 rounded" value={currentStaff.name} onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})} />
                            <input placeholder="Email" type="email" required className="w-full border p-2 rounded" value={currentStaff.email} onChange={e => setCurrentStaff({...currentStaff, email: e.target.value})} />
                            <label className="block text-xs font-bold text-gray-500 mt-2">Assign Department to Work</label>
                            <select required className="w-full border p-2 rounded" value={currentStaff.department} onChange={e => setCurrentStaff({...currentStaff, department: e.target.value})}>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
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

      {/* 3. DEPARTMENTS TAB */}
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

      {/* 4. REQUESTS TAB */}
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

    </div>
  );
};