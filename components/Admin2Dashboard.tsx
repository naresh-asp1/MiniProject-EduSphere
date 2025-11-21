import React, { useState } from 'react';
import { Student, ChangeRequest } from '../types';
import { CheckCircle, XCircle, Download, Filter, BrainCircuit, ClipboardCheck, MonitorCheck } from 'lucide-react';
import { analyzeClassPerformance } from '../services/geminiService';

interface Admin2Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  requests: ChangeRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChangeRequest[]>>;
}

export const Admin2Dashboard: React.FC<Admin2Props> = ({ students, setStudents, requests, setRequests }) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'verify_requests'>('monitor');
  const [filterGrade, setFilterGrade] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // --- VERIFICATION HANDLERS ---
  const toggleVerification = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, verified: !s.verified } : s));
  };

  // --- REQUEST HANDLERS ---
  const verifyRequest = (reqId: string, approve: boolean) => {
      setRequests(prev => prev.map(r => {
          if (r.id === reqId) {
              return { ...r, status: approve ? 'pending_admin1' : 'rejected' };
          }
          return r;
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Verification Portal (Admin II)</h1>
          <p className="text-gray-500">Monitor data integrity and verify student requests.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
             <button onClick={() => setActiveTab('monitor')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'monitor' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <MonitorCheck size={16} /> Data Monitor
            </button>
            <button onClick={() => setActiveTab('verify_requests')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'verify_requests' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <ClipboardCheck size={16} /> Verify Requests
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
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                    </select>
                    <button onClick={handleAiAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 disabled:opacity-50">
                        <BrainCircuit size={16} /> {isAnalyzing ? '...' : 'AI Analysis'}
                    </button>
                </div>
                 <button onClick={downloadCSV} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">
                    <Download size={16} /> Download Report
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
                                    {student.verified ? <span className="text-green-600 flex gap-1 items-center"><CheckCircle size={14}/> Yes</span> : <span className="text-amber-600 flex gap-1 items-center"><XCircle size={14}/> No</span>}
                                </td>
                                <td className="p-4 text-right">
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
                  <strong>Workflow:</strong> Verify the authenticity of the request. If approved, it will be sent to Admin I for database update.
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                      <tr>
                          <th className="p-4">Student</th>
                          <th className="p-4">Field to Change</th>
                          <th className="p-4">Requested Value</th>
                          <th className="p-4">Reason</th>
                          <th className="p-4">Decision</th>
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
                              <td colSpan={5} className="p-8 text-center text-gray-400">No pending requests to verify.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
};