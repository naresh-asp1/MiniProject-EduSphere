import React, { useState } from 'react';
import { Student, ChangeRequest, StaffProfile } from '../types';
import { CheckCircle, XCircle, Download, BrainCircuit, ClipboardCheck, MonitorCheck, Briefcase, CheckSquare, AlertCircle, FileText } from 'lucide-react';
import { analyzeClassPerformance } from '../services/geminiService';
import { generateStudentPDF } from '../services/pdfService';

interface Admin2Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  requests: ChangeRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChangeRequest[]>>;
  staffList?: StaffProfile[];
  setStaffList?: React.Dispatch<React.SetStateAction<StaffProfile[]>>;
}

export const Admin2Dashboard: React.FC<Admin2Props> = ({ 
  students, setStudents, 
  requests, setRequests,
  staffList, setStaffList
}) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'verify_requests' | 'verify_allocations'>('monitor');
  const [filterGrade, setFilterGrade] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // --- STUDENT VERIFICATION ---
  const toggleVerification = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, verified: !s.verified } : s));
  };

  // --- REQUEST VERIFICATION ---
  const verifyRequest = (reqId: string, approve: boolean) => {
      setRequests(prev => prev.map(r => {
          if (r.id === reqId) {
              return { ...r, status: approve ? 'pending_admin1' : 'rejected' };
          }
          return r;
      }));
  };

  // --- STAFF ALLOCATION VERIFICATION ---
  const verifyAllocation = (staffId: string, approve: boolean) => {
      if (!setStaffList) return;
      setStaffList(prev => prev.map(s => {
          if (s.id === staffId) {
              return { ...s, allocationStatus: approve ? 'verified' : 'rejected', allocatedSubjects: approve ? s.allocatedSubjects : [] };
          }
          return s;
      }));
  };

  const filteredStudents = students.filter(s => filterGrade ? s.grade === filterGrade : true);

  const downloadCSV = () => {
    const headers = ['ID', 'Name', 'Department', 'Grade', 'Verified', 'Attendance %', 'Backlogs'];
    const rows = filteredStudents.map(s => [
      s.id, s.name, s.department, s.grade, s.verified ? 'Yes' : 'No', s.attendancePercentage + '%', s.backlogs.join(';')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "EduSphere_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeClassPerformance(filteredStudents);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const pendingAllocations = staffList ? staffList.filter(s => s.allocationStatus === 'pending') : [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Verification Portal (Admin II)</h1>
          <p className="text-gray-500">Monitor data integrity and verify system changes.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
             <button onClick={() => setActiveTab('monitor')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'monitor' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <MonitorCheck size={16} /> Data Monitor
            </button>
            <button onClick={() => setActiveTab('verify_requests')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'verify_requests' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <ClipboardCheck size={16} /> Verify Requests
            </button>
            <button onClick={() => setActiveTab('verify_allocations')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'verify_allocations' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Briefcase size={16} /> Verify Allocations
                {pendingAllocations.length > 0 && <span className="bg-red-500 text-white rounded-full px-1.5 text-[10px]">{pendingAllocations.length}</span>}
            </button>
        </div>
      </div>

      {/* TAB 1: DATA MONITORING */}
      {activeTab === 'monitor' && (
          <>
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                    <select className="border rounded px-3 py-2" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
                        <option value="">All Grades</option>
                        <option value="I Year">I Year</option>
                        <option value="II Year">II Year</option>
                        <option value="III Year">III Year</option>
                        <option value="IV Year">IV Year</option>
                    </select>
                    <button onClick={handleAiAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 disabled:opacity-50">
                        <BrainCircuit size={16} /> {isAnalyzing ? '...' : 'AI Analysis'}
                    </button>
                </div>
                 <button onClick={downloadCSV} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">
                    <Download size={16} /> Bulk Report (CSV)
                </button>
            </div>

            {aiAnalysis && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded mb-6 text-sm whitespace-pre-line">
                    <div className="flex justify-between"><strong className="text-purple-900">AI Report:</strong> <button onClick={() => setAiAnalysis(null)}><XCircle size={16} className="text-purple-400"/></button></div>
                    {aiAnalysis}
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                        <tr>
                            <th className="p-4">Student</th>
                            <th className="p-4">Dept / Grade</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Verified?</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{student.name}</td>
                                <td className="p-4">{student.department} - {student.grade}</td>
                                <td className="p-4">
                                    <span className={student.attendancePercentage < 75 ? 'text-red-600 font-bold' : 'text-green-600'}>
                                        {student.attendancePercentage}% Att.
                                    </span>
                                </td>
                                <td className="p-4">
                                    {student.verified ? (
                                        <span className="text-green-600 flex gap-1 items-center"><CheckCircle size={14}/> Yes</span>
                                    ) : (
                                        <div className="group relative w-max">
                                            <span className="text-amber-600 flex gap-1 items-center cursor-help border-b border-dotted border-amber-600">
                                                <XCircle size={14}/> No
                                            </span>
                                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-50 shadow-xl pointer-events-none">
                                                <div className="flex items-center gap-2 font-bold mb-2 text-amber-400 border-b border-gray-600 pb-1">
                                                    <AlertCircle size={12} /> Pending Verification
                                                </div>
                                                <ul className="space-y-1.5 text-gray-300 list-disc list-inside">
                                                    <li>Record awaiting manual approval.</li>
                                                    {!student.tutorId && <li className="text-red-300">Tutor assignment pending.</li>}
                                                    {student.attendancePercentage < 75 && <li className="text-red-300">Warning: Low Attendance ({student.attendancePercentage}%).</li>}
                                                    {student.backlogs.length > 0 && <li className="text-orange-300">{student.backlogs.length} Active Backlog(s).</li>}
                                                </ul>
                                                <div className="mt-2 text-[10px] text-gray-500 italic">
                                                    Click 'Verify Data' to confirm this student.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button 
                                        onClick={() => generateStudentPDF(student)} 
                                        className="text-gray-500 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50"
                                        title="Download Individual PDF Report"
                                    >
                                        <FileText size={18} />
                                    </button>
                                    <button onClick={() => toggleVerification(student.id)} className="text-blue-600 hover:underline">
                                        {student.verified ? 'Revoke' : 'Verify Data'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </>
      )}

      {/* TAB 2: REQUEST VERIFICATION */}
      {activeTab === 'verify_requests' && (
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
              <div className="p-4 bg-blue-50 border-b border-blue-100 text-blue-800 text-sm">
                  <strong>Workflow:</strong> Verify the authenticity of student requests before Admin I updates the DB.
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                      <tr>
                          <th className="p-4">Student</th>
                          <th className="p-4">Field</th>
                          <th className="p-4">Requested Value</th>
                          <th className="p-4">Reason</th>
                          <th className="p-4">Action</th>
                      </tr>
                  </thead>
                  <tbody>
                      {requests.filter(r => r.status === 'pending_admin2').map(r => (
                          <tr key={r.id} className="border-b hover:bg-gray-50">
                              <td className="p-4 font-medium">{r.studentName}</td>
                              <td className="p-4">{r.field}</td>
                              <td className="p-4 font-bold">{r.newValue}</td>
                              <td className="p-4 text-gray-500 italic">"{r.reason}"</td>
                              <td className="p-4 flex gap-2">
                                  <button onClick={() => verifyRequest(r.id, true)} className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">Approve</button>
                                  <button onClick={() => verifyRequest(r.id, false)} className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">Reject</button>
                              </td>
                          </tr>
                      ))}
                      {requests.filter(r => r.status === 'pending_admin2').length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-400">No pending student requests.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      )}

      {/* TAB 3: STAFF ALLOCATION VERIFICATION */}
      {activeTab === 'verify_allocations' && (
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
              <div className="p-4 bg-purple-50 border-b border-purple-100 text-purple-800 text-sm">
                  <strong>HOD Allocations:</strong> Verify subject assignments made by Heads of Departments.
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                      <tr>
                          <th className="p-4">Staff Member</th>
                          <th className="p-4">Department</th>
                          <th className="p-4">Proposed Subjects</th>
                          <th className="p-4">Action</th>
                      </tr>
                  </thead>
                  <tbody>
                      {pendingAllocations.length > 0 ? pendingAllocations.map(s => (
                          <tr key={s.id} className="border-b hover:bg-gray-50">
                              <td className="p-4 font-medium">
                                  {s.name} <br/>
                                  <span className="text-xs text-gray-500 font-mono">{s.id}</span>
                              </td>
                              <td className="p-4">{s.department}</td>
                              <td className="p-4">
                                  <div className="flex flex-wrap gap-1">
                                      {s.allocatedSubjects.map(sub => (
                                          <span key={sub} className="bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">{sub}</span>
                                      ))}
                                  </div>
                              </td>
                              <td className="p-4 flex gap-2">
                                  <button onClick={() => verifyAllocation(s.id, true)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 shadow-sm flex items-center gap-1">
                                      <CheckSquare size={12} /> Verify
                                  </button>
                                  <button onClick={() => verifyAllocation(s.id, false)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-xs hover:bg-red-200 border border-red-200">
                                      Reject
                                  </button>
                              </td>
                          </tr>
                      )) : (
                          <tr>
                              <td colSpan={4} className="p-8 text-center text-gray-400">All subject allocations are up to date.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
};