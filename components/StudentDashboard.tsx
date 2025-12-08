
import React, { useState } from 'react';
import { Student, ChangeRequest, StaffProfile, Course } from '../types';
import { Send, User, Mail, Phone, MapPin, Calendar, Award, TrendingUp, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { db } from '../services/db';

interface StudentProps {
  student: Student;
  requests: ChangeRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChangeRequest[]>>;
  staffList: StaffProfile[];
  subjects: Course[];
}

export const StudentDashboard: React.FC<StudentProps> = ({ student, requests, setRequests, staffList, subjects }) => {
  const [requestField, setRequestField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Semester Filter
  const [selectedSem, setSelectedSem] = useState(student.currentSemester);
  const availableSemesters = Array.from({ length: student.currentSemester }, (_, i) => i + 1);
  
  // Helper to check pass/fail
  const isPassed = (mark: any) => {
      if (!mark) return false;
      const isPg = ['MBA', 'MCA'].includes(student.department);
      const passMark = isPg ? 50 : 40;
      // Strict check: Must pass semester exam AND overall grade must not be RA/U
      return (mark.semesterExam >= passMark) && (mark.gradeLabel !== 'RA' && mark.gradeLabel !== 'U');
  };

  // Get all subjects for the selected semester + any extra marks the student has for that semester
  const semesterMarks = React.useMemo(() => {
     // 1. Get standard curriculum for this semester
     const curriculumSubjects = subjects.filter(s => s.department === student.department && s.semester === selectedSem);
     
     // 2. Map to display format
     const displayList = curriculumSubjects.map(sub => {
         const existingMark = student.marks.find(m => m.code === sub.code);
         return {
             code: sub.code,
             name: sub.name,
             credits: sub.credits,
             total: existingMark ? (existingMark.total || existingMark.score) : null,
             semesterExam: existingMark?.semesterExam || 0,
             gradeLabel: existingMark?.gradeLabel,
             isRegistered: !!existingMark
         };
     });

     // 3. Add any subject in marks that isn't in standard curriculum (e.g. elective from another dept)
     const marksInSem = student.marks.filter(m => m.semester === selectedSem);
     marksInSem.forEach(m => {
         if (!displayList.find(d => d.code === m.code)) {
             displayList.push({
                 code: m.code,
                 name: m.name,
                 credits: m.credits,
                 total: m.total || m.score,
                 semesterExam: m.semesterExam,
                 gradeLabel: m.gradeLabel,
                 isRegistered: true
             });
         }
     });

     return displayList;
  }, [student, subjects, selectedSem]);


  if (!student) return null; // Safety check

  const tutor = staffList.find(s => s.id === student.tutorId);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: ChangeRequest = {
      id: `R${Math.floor(Math.random() * 10000)}`,
      studentId: student.id,
      studentName: student.name,
      field: requestField,
      oldValue: 'N/A',
      newValue,
      reason,
      status: 'pending_admin2'
    };
    
    setRequests(prev => [...prev, newRequest]);
    await db.upsertRequest(newRequest);
    
    setShowModal(false);
    setRequestField('');
    setNewValue('');
    setReason('');
    alert("Request sent to Admin II for verification.");
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] overflow-hidden flex flex-col md:flex-row gap-6">
        
        {/* LEFT PANEL: Personal Details */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto">
            <div className="p-6 text-center border-b border-gray-100 bg-gray-50/50">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-1 shadow-lg mb-4">
                    <div className="w-full h-full bg-white rounded-full overflow-hidden flex items-center justify-center">
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-gray-300" />
                        )}
                    </div>
                </div>
                <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
                <p className="text-sm text-gray-500 font-mono mt-1">{student.id}</p>
                <div className="mt-4 flex justify-center gap-2">
                     <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">{student.department}</span>
                     <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">Sem {student.currentSemester}</span>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Info</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Mail size={16} className="text-indigo-500"/> {student.email}
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Phone size={16} className="text-indigo-500"/> {student.contactNumber}
                        </div>
                        <div className="flex items-start gap-3 text-gray-600">
                            <MapPin size={16} className="text-indigo-500 mt-0.5 shrink-0"/> 
                            <span className="leading-tight">{student.address}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Academic Info</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Calendar size={16} className="text-indigo-500"/> Batch: {student.batch}
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <User size={16} className="text-indigo-500"/> Tutor: {tutor ? tutor.name : 'Not Assigned'}
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Award size={16} className="text-indigo-500"/> Residence: {student.residenceType}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => setShowModal(true)} 
                        className="w-full py-2.5 bg-white border border-indigo-200 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <Send size={16} /> Request Data Change
                    </button>
                </div>
            </div>
        </div>

        {/* RIGHT PANEL: Performance & Stats */}
        <div className="w-full md:w-2/3 flex flex-col gap-6 overflow-hidden">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp size={20} />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{student.attendancePercentage}%</div>
                    <div className="text-xs text-gray-500 font-medium">Attendance</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2">
                        <Award size={20} />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{student.cgpa || '0.00'}</div>
                    <div className="text-xs text-gray-500 font-medium">Current CGPA</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-2">
                        <AlertCircle size={20} />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{student.backlogs.length}</div>
                    <div className="text-xs text-gray-500 font-medium">Backlogs</div>
                </div>
            </div>

            {/* Marks Table Section */}
            <div className="bg-white flex-1 rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Award className="text-indigo-600" size={18}/> Semester Results
                    </h3>
                    <select 
                        value={selectedSem} 
                        onChange={(e) => setSelectedSem(Number(e.target.value))}
                        className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {availableSemesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                </div>
                
                <div className="overflow-y-auto p-0">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold sticky top-0">
                            <tr>
                                <th className="p-4">Subject</th>
                                <th className="p-4 text-center">Credits</th>
                                <th className="p-4 text-center">Total</th>
                                <th className="p-4 text-center">Sem Mark</th>
                                <th className="p-4 text-center">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {semesterMarks.map(m => (
                                <tr key={m.code} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{m.code}</div>
                                        <div className="text-xs text-gray-500">{m.name}</div>
                                    </td>
                                    <td className="p-4 text-center text-gray-500">{m.credits}</td>
                                    <td className="p-4 text-center font-bold text-gray-800">{m.total !== null ? m.total : '-'}</td>
                                    <td className="p-4 text-center text-gray-600">{m.semesterExam || '-'}</td>
                                    <td className="p-4 text-center">
                                        {m.total !== null 
                                            ? (isPassed(m)
                                                ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">PASS</span>
                                                : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">FAIL</span>)
                                            : <span className="text-xs text-gray-400 italic">Pending</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                            {semesterMarks.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                                        <Clock size={32} className="mb-2 opacity-50"/>
                                        No subjects found for Semester {selectedSem}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        {/* Request Modal */}
        {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-slide-up">
            <h2 className="text-xl font-bold mb-1 text-gray-800">Request Profile Update</h2>
            <p className="text-sm text-gray-500 mb-6">Submit a request to Admin II for data correction.</p>
            
            <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Field to Change</label>
                    <select 
                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        value={requestField} 
                        onChange={e => setRequestField(e.target.value)}
                        required
                    >
                        <option value="">Select Field</option>
                        <option value="Name">Name</option>
                        <option value="Contact">Contact Number</option>
                        <option value="Address">Address</option>
                        <option value="DOB">Date of Birth</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Value</label>
                    <input 
                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        placeholder="Enter correct value" 
                        value={newValue} 
                        onChange={e => setNewValue(e.target.value)} 
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
                    <textarea 
                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-24 resize-none" 
                        placeholder="Why is this change needed?" 
                        value={reason} 
                        onChange={e => setReason(e.target.value)}
                        required 
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md">Submit Request</button>
                </div>
            </form>
          </div>
        </div>
        )}
    </div>
  );
};
