


import React, { useState } from 'react';
import { Student } from '../types';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, TrendingUp, BookOpen, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ParentProps {
  student: Student;
}

export const ParentDashboard: React.FC<ParentProps> = ({ student }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'attendance'>('overview');
  const [selectedSem, setSelectedSem] = useState(student.currentSemester);

  const availableSemesters = Array.from({ length: student.currentSemester }, (_, i) => i + 1);
  const semesterMarks = student.marks.filter(m => m.semester === selectedSem);

  // Group attendance by Date for daily view
  const attendanceByDate = student.attendanceLog.reduce((acc, record) => {
      if (!acc[record.date]) acc[record.date] = [];
      acc[record.date].push(record);
      return acc;
  }, {} as Record<string, typeof student.attendanceLog>);

  const sortedDates = Object.keys(attendanceByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg overflow-hidden border-2 border-white">
              {student.photo ? (
                  <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                  <User size={36} />
              )}
          </div>
          <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
              <p className="text-gray-500 font-mono">{student.id} • {student.department} • {student.grade}</p>
          </div>
          <div className="ml-auto flex gap-2">
              <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'overview' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>Overview</button>
              <button onClick={() => setActiveTab('academic')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'academic' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>Academics</button>
              <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'attendance' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>Attendance</button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto">
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Student Profile</h3>
                  <div className="space-y-4">
                      <div className="flex gap-4">
                          <Mail className="text-indigo-400" size={20}/>
                          <div><div className="text-xs text-gray-400">Email</div><div className="font-medium text-sm">{student.email}</div></div>
                      </div>
                      <div className="flex gap-4">
                          <Phone className="text-indigo-400" size={20}/>
                          <div><div className="text-xs text-gray-400">Contact</div><div className="font-medium text-sm">{student.contactNumber}</div></div>
                      </div>
                      <div className="flex gap-4">
                          <Calendar className="text-indigo-400" size={20}/>
                          <div><div className="text-xs text-gray-400">DOB</div><div className="font-medium text-sm">{student.dob}</div></div>
                      </div>
                      <div className="flex gap-4">
                          <MapPin className="text-indigo-400" size={20}/>
                          <div><div className="text-xs text-gray-400">Address</div><div className="font-medium text-sm">{student.address}</div></div>
                      </div>
                  </div>
              </div>
              
              <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg text-center">
                              <div className="text-3xl font-bold text-green-600">{student.attendancePercentage}%</div>
                              <div className="text-xs text-green-800 font-medium">Attendance</div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg text-center">
                              <div className="text-3xl font-bold text-orange-600">{student.backlogs.length}</div>
                              <div className="text-xs text-orange-800 font-medium">Backlogs</div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Annual Report</h3>
                      <div className="text-sm text-gray-600 italic leading-relaxed">
                          "{student.performanceReport || 'Pending generation by staff.'}"
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 2. ACADEMIC TAB */}
      {activeTab === 'academic' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><GraduationCap /> Exam Results</h2>
                  <select 
                      value={selectedSem} 
                      onChange={(e) => setSelectedSem(Number(e.target.value))}
                      className="border rounded p-2 text-sm"
                  >
                      {availableSemesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
              </div>

              <div className="overflow-hidden border rounded-lg">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b">
                          <tr>
                              <th className="p-4">Subject Code</th>
                              <th className="p-4">Name</th>
                              <th className="p-4 text-center">Credits</th>
                              <th className="p-4 text-center">Score</th>
                              <th className="p-4 text-center">Result</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y">
                          {semesterMarks.map(m => (
                              <tr key={m.code}>
                                  <td className="p-4 font-mono">{m.code}</td>
                                  <td className="p-4 font-medium">{m.name}</td>
                                  <td className="p-4 text-center">{m.credits}</td>
                                  <td className="p-4 text-center font-bold">{m.score}</td>
                                  <td className="p-4 text-center">
                                      {m.score >= 50 
                                          ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">PASS</span>
                                          : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">FAIL</span>
                                      }
                                  </td>
                              </tr>
                          ))}
                          {semesterMarks.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No marks recorded.</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* 3. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
          <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                  <div>
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp /> Attendance Daily Log</h2>
                      <p className="text-gray-500 text-sm">Detailed view of attendance marked by staff subject-wise.</p>
                  </div>
                  <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">{student.attendancePercentage}%</div>
                      <div className="text-xs text-gray-500 uppercase font-bold">Overall Percentage</div>
                  </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {sortedDates.length > 0 ? sortedDates.map(date => (
                      <div key={date} className="border-b last:border-0">
                          <div className="bg-gray-50 px-6 py-3 font-bold text-gray-700 text-sm flex items-center gap-2">
                              <Calendar size={16} className="text-gray-400" />
                              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="divide-y">
                              {attendanceByDate[date].map(record => (
                                  <div key={record.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                      <div>
                                          <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                              {record.courseCode}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">Recorded by Staff</div>
                                      </div>
                                      <div>
                                          {record.status === 'Present' ? (
                                              <span className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
                                                  <CheckCircle size={14} /> Present
                                              </span>
                                          ) : (
                                              <span className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold">
                                                  <XCircle size={14} /> Absent
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )) : (
                      <div className="p-12 text-center text-gray-400">
                          <AlertCircle size={48} className="mx-auto mb-2 opacity-20"/>
                          No daily attendance records found.
                      </div>
                  )}
              </div>
          </div>
      )}

      </div>
    </div>
  );
};
