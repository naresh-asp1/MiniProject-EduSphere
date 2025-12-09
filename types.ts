
export enum Role {
  ADMIN1 = 'admin1',
  ADMIN2 = 'admin2',
  STAFF = 'staff',
  STUDENT = 'student',
  HOD = 'hod',
  PARENT = 'parent'
}

export const DEFAULT_CREDS = {
  ADMIN1: { user: 'admin1', pass: 'admin123' },
  ADMIN2: { user: 'admin2', pass: 'admin223' },
  STAFF_PASS: 'staff123',
  STUDENT_PASS: 'student123',
  PARENT_PASS: 'parent123'
};

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  department?: string;
  isHod?: boolean; 
  studentId?: string; // For Parents
}

export interface AdminProfile {
    id: string;
    name: string;
    username: string;
    password: string;
    role: Role.ADMIN1 | Role.ADMIN2;
}

export interface SubjectMark {
  code: string;
  name: string;
  credits: number;
  semester: number;
  
  // Detailed Marks Breakdown
  assignment1: number; // Max 10
  assignment2: number; // Max 10
  internal1: number;   // Max 40
  internal2: number;   // Max 40
  semesterExam: number;// Max 100
  
  total: number;       
  gradeLabel: string;  // O, A+, A, B+, B, RA
  gradePoint: number;  // 10, 9, 8, 7, 6, 0
  score: number;       // Kept for backward compat (same as total)
}

export interface AttendanceRecord {
  id: string;
  date: string;
  courseCode: string;
  status: 'Present' | 'Absent';
  department: string;
}

export interface Student {
  id: string; // Roll No
  name: string;
  email: string;
  photo?: string; // Base64 Image URL
  dob: string;
  batch: number; 
  currentSemester: number; 
  grade: string; // Year
  section: string;
  department: string;
  contactNumber: string;
  address: string;
  residenceType: 'Hosteller' | 'Day Scholar'; 
  tutorId?: string; 
  parentId?: string;
  feesPaid: boolean; 
  verified: boolean;
  marks: SubjectMark[]; 
  attendanceLog: AttendanceRecord[];
  attendancePercentage: number;
  backlogs: string[]; 
  performanceReport: string;
  cgpa: number; // Cumulative Grade Point Average
}

export interface Department {
  id: string;
  name: string;
}

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  photo?: string; // Base64 Image URL
  department: string;
  allocatedSubjects: string[]; // Course Codes
  allocationStatus: 'pending' | 'verified' | 'rejected'; // Admin 2 Verification Status
  isHod: boolean; 
}

export interface ParentProfile {
  id: string;
  name: string;
  email: string;
  studentId: string; // Link to child
  contactNumber: string;
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

// --- DYNAMIC CURRICULUM ---
export interface Course {
  code: string;
  name: string;
  credits: number;
  department: string;
  semester: number;
  type: 'Theory' | 'Lab'; // New Field
}

// --- INITIAL DATA ---

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'CSE', name: 'Computer Science & Eng' },
  { id: 'ECE', name: 'Electronics & Communication' },
  { id: 'MECH', name: 'Mechanical Engineering' },
  { id: 'CIVIL', name: 'Civil Engineering' },
  { id: 'IT', name: 'Information Technology' },
  { id: 'AI', name: 'Artificial Intelligence & DS' },
  { id: 'EEE', name: 'Electrical & Electronics' },
  { id: 'BME', name: 'Biomedical Engineering' },
  { id: 'CHEM', name: 'Chemical Engineering' },
  { id: 'MBA', name: 'Business Administration' },
  { id: 'MCA', name: 'Computer Applications' }
];

export const INITIAL_STAFF: StaffProfile[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_PARENTS: ParentProfile[] = [];
export const INITIAL_ADMINS: AdminProfile[] = [
    { id: 'ADM01', name: 'Master Admin', username: 'admin1', password: 'admin123', role: Role.ADMIN1 },
    { id: 'ADM02', name: 'Verifier Admin', username: 'admin2', password: 'admin223', role: Role.ADMIN2 }
];
