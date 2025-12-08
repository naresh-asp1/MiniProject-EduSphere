
import React, { useState } from 'react';
import { Student, ChangeRequest, StaffProfile, ParentProfile, Course } from '../types';
import { CheckCircle, XCircle, Download, BrainCircuit, ClipboardCheck, MonitorCheck, Briefcase, CheckSquare, AlertCircle, FileText, Bell, Users, Search, Filter, Wallet, UserCheck, ShieldCheck } from 'lucide-react';
import { db } from '../services/db';
import { generateStudentPDF } from '../services/pdfService';

interface Admin2Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  requests: ChangeRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChangeRequest[]>>;
  staffList?: StaffProfile[];
  setStaffList?: React.Dispatch<React.SetStateAction<StaffProfile[]>>;
  subjects: Course[];
}

export const Admin2Dashboard: React.FC<Admin2Props> = ({ 
  students, setStudents, 
  requests, setRequests,
  staffList, setStaffList,
  subjects
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'monitor_students' | 'monitor_staff' | 'monitor_parents' | 'verify_requests' | 'verify_allocations'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all'|'verified'|'unverified'>('all');
  const [filterFees, setFilterFees] = useState<'all'|'paid'|'pending'>('all');

  const toggleVerification = async (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    const updated = { ...student, verified: !student.verified };
    setStudents(prev => prev.map(s => s.id === id ? updated : s));
    await db.upsertStudent(updated);
  };

  const verifyRequest = async (reqId: string, approve: boolean) => {
      const req = requests.find(r => r.id === reqId);
      if (!req) return;
      const updated = { ...req, status: approve ? 'pending_admin1' : 'rejected' } as ChangeRequest;
      setRequests(prev => prev.map(r => r.id === reqId ? updated : r));
      await db.upsertRequest(updated);
  };

  const verifyAllocation = async (staffId: string, approve: boolean) => {
      if (!setStaffList || !staffList) return;
      const staff = staffList.find(s => s.id === staffId);
      if (!staff) return;
      
      const updated: StaffProfile = { 
        ...staff, 
        allocationStatus: approve ? 'verified' : 'rejected', 
        allocatedSubjects: approve ? staff.allocatedSubjects : [] 
      };
      setStaffList(prev => prev.map(s => s.id === staffId ? updated : s));
      await db.upsertStaff(updated);
  };

  const handleDownloadReport = (studentId: string) => {
      const student = students.find(s => s.id === studentId);
      if(student) generateStudentPDF(student);
  };

  // Filtered Lists
  const filteredStudents = students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept ? s.department === filterDept : true;
      const matchesVer = filterVerified === 'all' ? true : filterVerified === 'verified' ? s.verified : !s.verified;
      const matchesFees = filterFees === 'all' ? true : filterFees === 'paid' ? s.feesPaid : !s.feesPaid;
      return matchesSearch && matchesDept && matchesVer && matchesFees;
  });

  const pendingRequestsCount = requests.filter(r => r.status === 'pending_admin2').length;
  const pendingAllocationsCount = staffList ? staffList.filter(s => s.allocationStatus === 'pending').length : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data Verification & Monitoring</h1>
            <p className="text-sm text-gray-500 mt-1">Admin II Control Center</p>
        </div>
        
        {/* Verification Alert Banner (Conditional) */}
        {(pendingAllocationsCount > 0 || pendingRequestsCount > 0) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 flex items-center gap-3">
                <AlertCircle size={20} className="text-orange-600 animate-pulse"/>
                <div className="text-sm text-orange-800">
                    <strong>Action Required:</strong> 
                    {pendingRequestsCount > 0 && <span> {pendingRequestsCount} Requests</span>}
                    {pendingRequestsCount > 0 && pendingAllocationsCount > 0 && <span>, </span>}
                    {pendingAllocationsCount > 0 && <span> {pendingAllocationsCount} Allocations</span>}
                </div>
            </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
             <button onClick={() => setActiveTab('overview')} className={`text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><MonitorCheck size={18}/> Overview</button>
             <div className="h-px bg-gray-200 my-2"></div>
             <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Monitor Data</p>
             <button onClick={() => setActiveTab('monitor_students')} className={`text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${activeTab === 'monitor_students' ? 'bg-white text-indigo-600 shadow border border-indigo-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}><Users size={18}/> Students</button>
             <button onClick={() => setActiveTab('monitor_staff')} className={`text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${activeTab === 'monitor_staff' ? 'bg-white text-indigo-600 shadow border border-indigo-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}><Briefcase size={18}/> Staff</button>
             <button onClick={() => setActiveTab('monitor_parents')} className={`text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${activeTab === 'monitor_parents' ? 'bg-white text-indigo-600 shadow border border-indigo-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}><Users size={18}/> Parents</button>
             <div className="h-px bg-gray-200 my-2"></div>
             <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Verification</p>
             <button onClick={() => setActiveTab('verify_requests')} className={`text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-between transition-colors ${activeTab === 'verify_requests' ? 'bg-white text-indigo-600 shadow border border-indigo-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
                 <div className="flex items-center gap-3"><FileText size={18}/> Requests</div>
                 {pendingRequestsCount > 0 && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">{pendingRequestsCount}</span>}
             </button>
             <button onClick={() => setActiveTab('verify_allocations')} className={`text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-between transition-colors ${activeTab === 'verify_allocations' ? 'bg-white text-indigo-600 shadow border border-indigo-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
                 <div className="flex items-center gap-3"><ClipboardCheck size={18}/> Allocations</div>
                 {pendingAllocationsCount > 0 && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">{pendingAllocationsCount}</span>}
             </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Students</h3>
                          <div className="text-3xl font-bold text-gray-800">{students.length}</div>
                          <div className="mt-2 text-xs text-gray-400 flex gap-2">
                              <span className="text-green-600 font-bold">{students.filter(s => s.verified).length} Verified</span>
                              <span className="text-red-500 font-bold">{students.filter(s => !s.verified).length} Pending</span>
                          </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h3 className="text-gray-500 text-sm font-medium mb-2">Fees Collection</h3>
                          <div className="text-3xl font-bold text-gray-800">{Math.round((students.filter(s => s.feesPaid).length / (students.length || 1)) * 100)}%</div>
                          <div className="mt-2 text-xs text-gray-400">
                              <span className="text-red-500 font-bold">{students.filter(s => !s.feesPaid).length} Students Pending Payment</span>
                          </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h3 className="text-gray-500 text-sm font-medium mb-2">Staff Strength</h3>
                          <div className="text-3xl font-bold text-gray-800">{staffList?.length || 0}</div>
                          <div className="mt-2 text-xs text-gray-400">
                              <span className="text-indigo-600 font-bold">{staffList?.filter(s => s.isHod).length} HODs</span>
                          </div>
                      </div>
                  </div>
              )}

              {/* STUDENT MONITOR */}
              {activeTab === 'monitor_students' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-center">
                          <div className="relative flex-1 min-w-[200px]">
                              <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                              <input 
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                              />
                          </div>
                          <select className="border p-2 rounded-lg text-sm" value={filterVerified} onChange={e => setFilterVerified(e.target.value as any)}>
                              <option value="all">Verification: All</option>
                              <option value="verified">Verified Only</option>
                              <option value="unverified">Pending Only</option>
                          </select>
                          <select className="border p-2 rounded-lg text-sm" value={filterFees} onChange={e => setFilterFees(e.target.value as any)}>
                              <option value="all">Fees: All</option>
                              <option value="paid">Paid</option>
                              <option value="pending">Pending</option>
                          </select>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-gray-100">
                                <tr>
                                    <th className="p-4">Student Name</th>
                                    <th className="p-4">Department</th>
                                    <th className="p-4 text-center">Attendance</th>
                                    <th className="p-4 text-center">Fees Status</th>
                                    <th className="p-4 text-center">Verified</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredStudents.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium">
                                            {s.name}
                                            <div className="text-xs text-gray-500 font-mono">{s.id}</div>
                                        </td>
                                        <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{s.department}</span></td>
                                        <td className="p-4 text-center font-bold text-gray-700">{s.attendancePercentage}%</td>
                                        <td className="p-4 text-center">
                                            {s.feesPaid 
                                                ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle size={12}/> Paid</span>
                                                : <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold"><Wallet size={12}/> Pending</span>
                                            }
                                        </td>
                                        <td className="p-4 text-center">
                                            {s.verified ? <CheckCircle size={20} className="text-green-500 mx-auto"/> : (
                                                <div className="group relative inline-block">
                                                    <AlertCircle size={20} className="text-red-500 mx-auto cursor-help"/>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black text-white text-xs rounded p-2 hidden group-hover:block z-10 text-center">
                                                        Missing Verification.<br/> Check Documents.
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button onClick={() => toggleVerification(s.id)} className="text-indigo-600 text-xs font-bold hover:underline">
                                                {s.verified ? 'Revoke' : 'Verify'}
                                            </button>
                                            <button onClick={() => handleDownloadReport(s.id)} className="text-gray-400 hover:text-gray-600"><Download size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              )}

              {/* STAFF MONITOR */}
              {activeTab === 'monitor_staff' && staffList && (
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                       <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-gray-100">
                                <tr>
                                    <th className="p-4">Staff Name</th>
                                    <th className="p-4">Department</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Subject Load</th>
                                    <th className="p-4 text-center">Allocation Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {staffList.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium">
                                            {s.name}
                                            <div className="text-xs text-gray-500">{s.email}</div>
                                        </td>
                                        <td className="p-4">{s.department}</td>
                                        <td className="p-4">{s.isHod ? <span className="text-purple-600 font-bold text-xs">HOD</span> : 'Staff'}</td>
                                        <td className="p-4">{s.allocatedSubjects.length} Subjects</td>
                                        <td className="p-4 text-center">
                                            {s.allocationStatus === 'verified' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Verified</span>}
                                            {s.allocationStatus === 'pending' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Pending</span>}
                                            {s.allocationStatus === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Rejected</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                       </table>
                   </div>
              )}

              {/* REQUESTS VERIFICATION */}
              {activeTab === 'verify_requests' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="text-indigo-600"/> Pending Data Change Requests</h2>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50"><tr><th className="p-3 rounded-l-lg">Student</th><th className="p-3">Field</th><th className="p-3">New Value</th><th className="p-3">Reason</th><th className="p-3 rounded-r-lg">Action</th></tr></thead>
                        <tbody className="divide-y">
                            {requests.filter(r => r.status === 'pending_admin2').map(r => (
                                <tr key={r.id}>
                                    <td className="p-3 font-medium">{r.studentName}</td>
                                    <td className="p-3 font-mono text-gray-600">{r.field}</td>
                                    <td className="p-3 font-bold text-green-600">{r.newValue}</td>
                                    <td className="p-3 text-gray-500 italic">"{r.reason}"</td>
                                    <td className="p-3 flex gap-2">
                                        <button onClick={() => verifyRequest(r.id, true)} className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors"><CheckCircle size={18}/></button>
                                        <button onClick={() => verifyRequest(r.id, false)} className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"><XCircle size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                            {requests.filter(r => r.status === 'pending_admin2').length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No pending requests</td></tr>}
                        </tbody>
                    </table>
                  </div>
              )}

              {/* ALLOCATION VERIFICATION */}
              {activeTab === 'verify_allocations' && staffList && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ClipboardCheck className="text-indigo-600"/> Pending Subject Allocations</h2>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50"><tr><th className="p-3 rounded-l-lg">Staff</th><th className="p-3">Department</th><th className="p-3">Allocated Subjects</th><th className="p-3 rounded-r-lg">Action</th></tr></thead>
                        <tbody className="divide-y">
                            {staffList.filter(s => s.allocationStatus === 'pending').map(s => (
                                <tr key={s.id}>
                                    <td className="p-3 font-medium">{s.name}</td>
                                    <td className="p-3">{s.department}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {s.allocatedSubjects.map(subCode => {
                                                const subName = subjects.find(sub => sub.code === subCode)?.name || subCode;
                                                return <span key={subCode} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs" title={subName}>{subCode}</span>
                                            })}
                                        </div>
                                    </td>
                                    <td className="p-3 flex gap-2">
                                        <button onClick={() => verifyAllocation(s.id, true)} className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors"><CheckCircle size={18}/></button>
                                        <button onClick={() => verifyAllocation(s.id, false)} className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"><XCircle size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                            {staffList.filter(s => s.allocationStatus === 'pending').length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No pending allocations</td></tr>}
                        </tbody>
                    </table>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
