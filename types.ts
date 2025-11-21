export enum Role {
  ADMIN1 = 'admin1', // Master Admin: CRUD Students/Staff/Depts, Final Request Execution
  ADMIN2 = 'admin2', // Verifier: Monitor, First level Request Verification
  STAFF = 'staff',   // Teacher: Marks, Daily Attendance, Backlogs, Reports
  STUDENT = 'student' // User: View data, Request changes
}

export interface User {
  id: string;
  username: string;
  role: Role;
  name: string;
  department?: string;
}

export interface Marks {
  math: number;
  science: number;
  english: number;
  history: number;
  computer: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  courseCode: string;
  status: 'Present' | 'Absent';
  department: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  dob: string;
  grade: string; // e.g., "10th"
  section: string; // e.g., "A"
  department: string;
  contactNumber: string;
  address: string;
  verified: boolean;
  marks: Marks;
  attendanceLog: AttendanceRecord[];
  attendancePercentage: number; // 0-100 (Derived or Manual)
  backlogs: string[]; // List of subjects
  performanceReport: string; // AI Generated or Manual
}

export interface Department {
  id: string;
  name: string;
}

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface ChangeRequest {
  id: string;
  studentId: string;
  studentName: string;
  field: string;
  oldValue: string;
  newValue: string;
  status: 'pending_admin2' | 'pending_admin1' | 'approved' | 'rejected';
  reason: string;
}

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'CSE', name: 'Computer Science' },
  { id: 'ECE', name: 'Electronics & Comm' },
  { id: 'MECH', name: 'Mechanical Eng' }
];

export const INITIAL_STAFF: StaffProfile[] = [
  { id: 'ST001', name: 'Prof. Severus', email: 'severus@edusphere.edu', department: 'CSE' }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'S001',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    dob: '2008-05-14',
    grade: '10',
    section: 'A',
    department: 'CSE',
    contactNumber: '555-0101',
    address: '123 Maple St, Springfield',
    verified: true,
    marks: { math: 85, science: 92, english: 88, history: 76, computer: 95 },
    attendanceLog: [],
    attendancePercentage: 94,
    backlogs: [],
    performanceReport: 'Alice is an exceptional student with a strong aptitude for sciences.'
  },
  {
    id: 'S002',
    name: 'Bob Smith',
    email: 'bob@example.com',
    dob: '2007-11-20',
    grade: '10',
    section: 'B',
    department: 'ECE',
    contactNumber: '555-0102',
    address: '456 Oak Ave, Springfield',
    verified: false,
    marks: { math: 65, science: 70, english: 60, history: 80, computer: 75 },
    attendanceLog: [],
    attendancePercentage: 82,
    backlogs: ['Math'],
    performanceReport: ''
  },
  {
    id: 'S003',
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    dob: '2008-01-10',
    grade: '10',
    section: 'A',
    department: 'CSE',
    contactNumber: '555-0103',
    address: '789 Pine Ln, Springfield',
    verified: true,
    marks: { math: 95, science: 98, english: 92, history: 88, computer: 99 },
    attendanceLog: [],
    attendancePercentage: 98,
    backlogs: [],
    performanceReport: 'Outstanding academic performance across all subjects.'
  }
];