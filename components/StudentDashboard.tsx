
import React, { useState } from 'react';
import { Student, ChangeRequest, StaffProfile } from '../types';
import { Send, History, FileText, AlertTriangle, User, Mail, Phone, MapPin, Calendar, GraduationCap, BookOpen, ChevronRight, TrendingUp, Award, Home, UserCheck, X, CheckCircle, XCircle } from 'lucide-react';

interface StudentProps {
  student: Student;
  requests: ChangeRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChangeRequest[]>>;
  staffList: StaffProfile[];
}

export const StudentDashboard: React.FC<StudentProps> = ({ student, requests, setRequests, staffList }) => {
  const [selectedSemester, setSelectedSemester] = useState(student.currentSemester);
  const [requestField, setRequestField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  const myRequests = requests.filter(r => r.studentId === student.id);
  const myTutor = staffList.find(s => s.id === student.tutorId);

  const handleRequestSubmit = (e: React.FormEvent) => {
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
    setShowModal(false);
    setRequestField('');
    setNewValue('');
    setReason('');
    alert("Request sent to Admin II for verification.");
  };

  // Filter marks by semester
  const semesterMarks = student.marks.filter(m => m.semester === selectedSemester);
  
  // Calculate CGPA for this semester (Simple Average for demo)
  const semAverage = semesterMarks.length > 0 
    ? (semesterMarks.reduce((acc, m) => acc + m.score, 0) / semesterMarks.length).toFixed(1)
    : "N/A";

  // Generate array of available semesters [1, ... , currentSemester]
  const availableSemesters = Array.from({ length: student.currentSemester }, (_, i) => i + 1);

  // Group attendance
  const attendanceByDate = student.attendanceLog.reduce((acc, record) => {
      if (!acc[record.date]) acc[record.date] = [];
      acc[record.date].push(record);
      return acc;
  }, {} as Record<string, typeof student.attendanceLog>);
  const sortedDates = Object.keys(attendanceByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());


  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: PERSONAL DETAILS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* ID Card Style Profile */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
            <div className="px-6 pb-6 text-center relative">
               <div className="w-24 h-24 mx-auto bg-white p-1 rounded-full -mt-12 shadow-md">
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                      <User size={40} />
                  </div>
               </div>
               <h2 className="text-xl font-bold text-gray-800 mt-3">{student.name}</h2>
               <p className="text-sm text-gray-500 font-mono">{student.id}</p>
               <div className="mt-3 flex flex-wrap justify-center gap-2">
                 <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">{student.department}</span>
                 <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">{student.grade}</span>
               </div>
            </div>
          </div>

          {/* Personal Info Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Personal Details</h3>
              <div className="space-y-4">
                  <div className="flex items-start gap-3">
                      <Mail className="text-gray-400 mt-0.5" size={18} />
                      <div>
                          <p className="text-xs text-gray-500">Email Address</p>
                          <p className="text-sm font-medium text-gray-800 break-all">{student.email}</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <Phone className="text-gray-400 mt-0.5" size={18} />
                      <div>
                          <p className="text-xs text-gray-500">Contact Number</p>
                          <p className="text-sm font-medium text-gray-800">{student.contactNumber}</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <Calendar className="text-gray-400 mt-0.5" size={18} />
                      <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="text-sm font-medium text-gray-800">{student.dob}</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <Home className="text-gray-400 mt-0.5" size={18} />
                      <div>
                          <p className="text-xs text-gray-500">Residence Type</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${student.residenceType === 'Hosteller' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                              {student.residenceType}
                          </span>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                      <MapPin className="text-gray-400 mt-0.5" size={18} />
                      <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm font-medium text-gray-800 leading-tight">{student.address}</p>
                      </div>
                  </div>
              </div>

               {/* MENTOR DETAILS */}
               {myTutor && (
                  <div className="mt-6 pt-6 border-t">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                          <UserCheck size={14}/> Assigned Tutor
                      </h4>
                      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                          <p className="font-bold text-indigo-900 text-sm">{myTutor.name}</p>
                          <p className="text-xs text-indigo-700 break-all">{myTutor.email}</p>
                      </div>
                  </div>
               )}
              
              <div className="mt-6 pt-6 border-t">
                  <button onClick={() => setShowModal(true)} className="w-full bg-white border border-indigo-200 text-indigo-700 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                      <Send size={16} /> Request Data Update
                  </button>
              </div>
          </div>

          {/* Request History Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-700 font-bold text-sm mb-3">
                  <History size={16} /> Request History
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                  {myRequests.length > 0 ? myRequests.map(r => (
                      <div key={r.id} className="text-xs p-2 bg-gray-50 rounded border border-gray-100">
                          <div className="flex justify-between mb-1">
                              <span className="font-semibold">{r.field}</span>
                              <span className={`px-1.5 rounded text-[10px] ${
                                  r.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  r.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'
                              }`}>{r.status}</span>
                          </div>
                          <div className="text-gray-500 truncate">{r.newValue}</div>
                      </div>
                  )) : (
                      <div className="text-xs text-gray-400 text-center py-2">No requests made.</div>
                  )}
              </div>
          </div>
        </div>

        {/* RIGHT PANEL: ACADEMIC PERFORMANCE */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Header & Sem Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <GraduationCap className="text-indigo-600" /> Academic Performance
                        </h1>
                        <p className="text-gray-500 text-sm">View your marks, attendance, and grades semester-wise.</p>
                    </div>
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                        <span className="text-xs font-bold text-gray-500 px-3 uppercase">Semester:</span>
                        <select 
                            value={selectedSemester} 
                            onChange={(e) => setSelectedSemester(Number(e.target.value))}
                            className="bg-white text-sm font-medium text-gray-800 py-1 pl-3 pr-8 rounded shadow-sm border-0 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            {availableSemesters.map(sem => (
                                <option key={sem} value={sem}>Sem {sem}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Marks Table */}
                <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="p-4">Course Code</th>
                                <th className="p-4">Subject Name</th>
                                <th className="p-4 text-center">Credits</th>
                                <th className="p-4 text-center">Score</th>
                                <th className="p-4 text-center">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {semesterMarks.length > 0 ? semesterMarks.map(m => (
                                <tr key={m.code} className="hover:bg-gray-50/50">
                                    <td className="p-4 font-mono text-gray-600">{m.code}</td>
                                    <td className="p-4 font-medium text-gray-800">{m.name}</td>
                                    <td className="p-4 text-center text-gray-500">{m.credits}</td>
                                    <td className="p-4 text-center font-bold">{m.score}</td>
                                    <td className="p-4 text-center">
                                        {m.score >= 50 
                                            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">PASS</span>
                                            : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">FAIL</span>
                                        }
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 flex flex-col items-center">
                                        <BookOpen size={32} className="mb-2 opacity-20"/>
                                        No marks records found for Semester {selectedSemester}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {semesterMarks.length > 0 && (
                            <tfoot className="bg-gray-50 font-bold text-gray-700">
                                <tr>
                                    <td colSpan={3} className="p-4 text-right">Semester Average:</td>
                                    <td className="p-4 text-center text-indigo-600">{semAverage}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Performance Summary & Backlogs for Selected Sem */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                        <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                            <AlertTriangle size={18} /> Backlogs (Arrears)
                        </h3>
                        {student.backlogs.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {student.backlogs.map(b => (
                                    <span key={b} className="bg-white text-red-600 px-3 py-1 rounded border border-orange-200 text-xs font-mono font-bold shadow-sm">
                                        {b}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-orange-700 mt-1">No backlogs. All clear!</p>
                        )}
                    </div>

                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setShowAttendanceModal(true)}>
                         <h3 className="font-bold text-blue-800 mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2"><TrendingUp size={18} /> Attendance Overview</div>
                            <ChevronRight size={16} />
                        </h3>
                        <div className="flex items-end gap-4">
                            <span className="text-4xl font-bold text-blue-600">{student.attendancePercentage}%</span>
                            <span className="text-sm text-blue-700 mb-1">Overall Attendance</span>
                        </div>
                        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${student.attendancePercentage}%` }}></div>
                        </div>
                        <div className="mt-2 text-xs text-blue-600 text-right font-medium">Click to view detailed daily log</div>
                    </div>
                </div>
            </div>

            {/* AI Performance Report */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <FileText size={100} />
                </div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Award className="text-purple-600" /> Performance Evaluation Report
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 italic leading-relaxed text-sm">
                    "{student.performanceReport || 'Your annual performance report is currently being generated. Please check back later or contact your class advisor.'}"
                </div>
            </div>

        </div>
      </div>

      {/* MODAL FOR REQUEST */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Request Profile Update</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Which field needs correction?</label>
                    <select required className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none" value={requestField} onChange={e => setRequestField(e.target.value)}>
                        <option value="">Select Field...</option>
                        <option value="Name">Name</option>
                        <option value="Contact">Contact Number</option>
                        <option value="Address">Address</option>
                        <option value="DOB">Date of Birth</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Correct Value</label>
                    <input required type="text" placeholder="Enter the correct information" className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none" value={newValue} onChange={e => setNewValue(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Change</label>
                    <textarea required placeholder="Why are you requesting this change?" className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none resize-none" rows={3} value={reason} onChange={e => setReason(e.target.value)}></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow font-medium">Submit Request</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTENDANCE MODAL */}
      {showAttendanceModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp/> Daily Attendance Log</h2>
                      <button onClick={() => setShowAttendanceModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                      {sortedDates.length > 0 ? sortedDates.map(date => (
                          <div key={date} className="mb-4 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                              <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 text-sm flex items-center gap-2 border-b">
                                  <Calendar size={14} className="text-gray-400" />
                                  {new Date(date).toLocaleDateString()}
                              </div>
                              <div className="divide-y">
                                  {attendanceByDate[date].map(record => (
                                      <div key={record.id} className="px-4 py-3 flex items-center justify-between">
                                          <div>
                                              <div className="font-bold text-gray-800 text-sm">{record.courseCode}</div>
                                          </div>
                                          <div>
                                              {record.status === 'Present' ? (
                                                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                                      <CheckCircle size={12} /> Present
                                                  </span>
                                              ) : (
                                                  <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                                      <XCircle size={12} /> Absent
                                                  </span>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )) : (
                          <div className="text-center p-8 text-gray-400">No daily records found.</div>
                      )}
                  </div>
                  <div className="p-4 border-t text-right bg-white">
                      <button onClick={() => setShowAttendanceModal(false)} className="bg-gray-800 text-white px-4 py-2 rounded text-sm">Close</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
