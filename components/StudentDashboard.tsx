import React, { useState } from 'react';
import { Student, ChangeRequest } from '../types';
import { Send, History, FileText, AlertTriangle } from 'lucide-react';

interface StudentProps {
  student: Student;
  requests: ChangeRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChangeRequest[]>>;
}

export const StudentDashboard: React.FC<StudentProps> = ({ student, requests, setRequests }) => {
  const [requestField, setRequestField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [showModal, setShowModal] = useState(false);

  const myRequests = requests.filter(r => r.studentId === student.id);

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
      status: 'pending_admin2' // Goes to Admin 2 first
    };
    setRequests(prev => [...prev, newRequest]);
    setShowModal(false);
    setRequestField('');
    setNewValue('');
    setReason('');
    alert("Request sent to Admin II for verification.");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Portal</h1>
          <p className="text-gray-500">{student.name} | {student.department} - {student.grade}{student.section}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-md">
          <Send size={16} /> Raise Request
        </button>
      </div>

      {/* STRUCTURED REPORT CARD */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2"><FileText size={20} /> Consolidated Performance Report</h2>
              <span className="text-xs bg-indigo-500 px-2 py-1 rounded">EduSphere Official Record</span>
          </div>
          
          <div className="p-6">
              <table className="w-full border-collapse border border-gray-200 text-sm">
                  <tbody>
                      <tr className="border-b">
                          <td className="p-3 w-1/3 bg-gray-50 font-bold text-gray-700 border-r">Marks Obtained</td>
                          <td className="p-3">
                              <div className="grid grid-cols-3 gap-2">
                                  {Object.entries(student.marks).map(([sub, marks]) => (
                                      <div key={sub} className="flex justify-between border-b border-dashed pb-1">
                                          <span className="capitalize text-gray-500">{sub}</span>
                                          <span className="font-mono font-bold">{marks}</span>
                                      </div>
                                  ))}
                              </div>
                          </td>
                      </tr>
                      <tr className="border-b">
                          <td className="p-3 bg-gray-50 font-bold text-gray-700 border-r">Attendance Summary</td>
                          <td className="p-3">
                               <div className="flex items-center gap-4">
                                   <div className="text-2xl font-bold text-indigo-600">{student.attendancePercentage}%</div>
                                   <div className="text-xs text-gray-500">
                                       Total Sessions: {student.attendanceLog.length}<br/>
                                       Present: {student.attendanceLog.filter(l => l.status === 'Present').length}
                                   </div>
                               </div>
                          </td>
                      </tr>
                      <tr className="border-b">
                          <td className="p-3 bg-gray-50 font-bold text-gray-700 border-r">Backlogs / Arrears</td>
                          <td className="p-3">
                              {student.backlogs.length > 0 ? (
                                  <div className="flex gap-2 text-red-600 font-bold items-center">
                                      <AlertTriangle size={16} />
                                      {student.backlogs.join(", ")}
                                  </div>
                              ) : (
                                  <span className="text-green-600 font-medium">Nil (All Clear)</span>
                              )}
                          </td>
                      </tr>
                      <tr>
                          <td className="p-3 bg-gray-50 font-bold text-gray-700 border-r">Performance Highlights</td>
                          <td className="p-3 italic text-gray-600 leading-relaxed">
                              "{student.performanceReport || 'Evaluation pending...'}"
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>

      {/* REQUEST HISTORY */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <History size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-700">Request Status History</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="p-4">Field</th>
              <th className="p-4">New Value</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {myRequests.length > 0 ? myRequests.map(r => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-4">{r.field}</td>
                <td className="p-4">{r.newValue}</td>
                <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        r.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        r.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                        {r.status === 'pending_admin2' ? 'Processing (L1)' : 
                         r.status === 'pending_admin1' ? 'Verified (L2)' : 
                         r.status}
                    </span>
                </td>
              </tr>
            )) : (
                <tr><td colSpan={3} className="p-6 text-center text-gray-400">No requests raised yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Request Data Change</h2>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Field</label>
                    <select required className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none" value={requestField} onChange={e => setRequestField(e.target.value)}>
                        <option value="">Select...</option>
                        <option value="Name">Name</option>
                        <option value="Contact">Contact Number</option>
                        <option value="Address">Address</option>
                        <option value="DOB">Date of Birth</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">New Value</label>
                    <input required type="text" className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none" value={newValue} onChange={e => setNewValue(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Reason</label>
                    <textarea required className="w-full border p-2 rounded focus:ring-2 ring-indigo-500 outline-none" rows={3} value={reason} onChange={e => setReason(e.target.value)}></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow">Submit</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};