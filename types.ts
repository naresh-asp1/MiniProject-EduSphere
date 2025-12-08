

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

export interface SubjectMark {
  code: string;
  name: string;
  score: number; // 0-100
  credits: number;
  semester: number;
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
  verified: boolean;
  marks: SubjectMark[]; 
  attendanceLog: AttendanceRecord[];
  attendancePercentage: number;
  backlogs: string[]; 
  performanceReport: string;
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

// --- CURRICULUM DATA (Expanded for 8 Semesters) ---

export interface SubjectDef { code: string; name: string; credits: number; }

export const CURRICULUM: Record<string, Record<number, SubjectDef[]>> = {
  'CSE': {
    1: [
      { code: 'HS3151', name: 'Professional English - I', credits: 3 },
      { code: 'MA3151', name: 'Matrices and Calculus', credits: 4 },
      { code: 'PH3151', name: 'Engineering Physics', credits: 3 },
      { code: 'CY3151', name: 'Engineering Chemistry', credits: 3 },
      { code: 'GE3151', name: 'Problem Solving & Python', credits: 3 }
    ],
    2: [
      { code: 'HS3251', name: 'Professional English - II', credits: 3 },
      { code: 'MA3251', name: 'Statistics and Numerical Methods', credits: 4 },
      { code: 'PH3256', name: 'Physics for Information Science', credits: 3 },
      { code: 'BE3251', name: 'Basic EEE', credits: 3 },
      { code: 'CS3251', name: 'Programming in C', credits: 3 }
    ],
    3: [
      { code: 'MA3354', name: 'Discrete Mathematics', credits: 4 },
      { code: 'CS3301', name: 'Data Structures', credits: 3 },
      { code: 'CS3351', name: 'Digital Principles', credits: 4 },
      { code: 'CS3391', name: 'Object Oriented Programming', credits: 3 },
      { code: 'CD3291', name: 'Data Structures & Alg.', credits: 3 }
    ],
    4: [
      { code: 'CS3452', name: 'Theory of Computation', credits: 4 },
      { code: 'CS3491', name: 'Artificial Intelligence', credits: 3 },
      { code: 'CS3492', name: 'Database Management Systems', credits: 3 },
      { code: 'CS3451', name: 'Introduction to Operating Systems', credits: 3 },
      { code: 'GE3451', name: 'Environmental Sciences', credits: 2 }
    ],
    5: [
      { code: 'CS3501', name: 'Compiler Design', credits: 4 },
      { code: 'CS3591', name: 'Computer Networks', credits: 3 },
      { code: 'CS3551', name: 'Distributed Systems', credits: 3 },
      { code: 'CCS334', name: 'Big Data Analytics', credits: 3 },
      { code: 'CCS375', name: 'Web Technology', credits: 3 }
    ],
    6: [
      { code: 'CS3691', name: 'Embedded Systems and IoT', credits: 4 },
      { code: 'CS3601', name: 'Design and Analysis of Algorithms', credits: 4 },
      { code: 'CCS341', name: 'Data Warehousing', credits: 3 },
      { code: 'CCS354', name: 'Network Security', credits: 3 },
      { code: 'MX3089', name: 'Industrial Safety', credits: 0 }
    ],
    7: [
      { code: 'GE3791', name: 'Human Values and Ethics', credits: 2 },
      { code: 'CS3701', name: 'Cloud Computing', credits: 3 },
      { code: 'CS3791', name: 'Cryptography & Security', credits: 3 },
      { code: 'CCS356', name: 'Object Oriented Analysis', credits: 3 },
      { code: 'CS3711', name: 'Mechatronics', credits: 3 }
    ],
    8: [
      { code: 'CS3801', name: 'Project Work', credits: 10 },
      { code: 'GE3851', name: 'Professional Ethics', credits: 3 }
    ]
  },
  'ECE': {
    1: [
      { code: 'HS3151', name: 'Professional English - I', credits: 3 },
      { code: 'MA3151', name: 'Matrices and Calculus', credits: 4 },
      { code: 'PH3151', name: 'Engineering Physics', credits: 3 },
      { code: 'CY3151', name: 'Engineering Chemistry', credits: 3 },
      { code: 'GE3151', name: 'Python Programming', credits: 3 }
    ],
    2: [
      { code: 'HS3251', name: 'Professional English - II', credits: 3 },
      { code: 'MA3251', name: 'Statistics and Numerical Methods', credits: 4 },
      { code: 'PH3254', name: 'Physics for Electronics', credits: 3 },
      { code: 'BE3254', name: 'Electrical Engineering', credits: 3 },
      { code: 'EC3251', name: 'Circuit Analysis', credits: 4 }
    ],
    3: [
      { code: 'MA3355', name: 'Transforms and PDE', credits: 4 },
      { code: 'EC3354', name: 'Signals and Systems', credits: 4 },
      { code: 'EC3353', name: 'Electronic Circuits I', credits: 3 },
      { code: 'EC3351', name: 'Control Systems', credits: 3 },
      { code: 'EC3352', name: 'Digital Electronics', credits: 3 }
    ],
    4: [
      { code: 'EC3452', name: 'Electromagnetic Fields', credits: 4 },
      { code: 'EC3451', name: 'Linear Integrated Circuits', credits: 3 },
      { code: 'EC3492', name: 'DSP', credits: 4 },
      { code: 'EC3401', name: 'Networks and Security', credits: 3 },
      { code: 'GE3451', name: 'Environmental Sciences', credits: 2 }
    ],
    5: [
      { code: 'EC3501', name: 'Wireless Communication', credits: 3 },
      { code: 'EC3552', name: 'VLSI Design', credits: 3 },
      { code: 'EC3551', name: 'Transmission Lines', credits: 3 },
      { code: 'EC3591', name: 'Medical Electronics', credits: 3 },
      { code: 'CCS331', name: 'Embedded Systems', credits: 3 }
    ],
    6: [
      { code: 'EC3651', name: 'Wireless Networks', credits: 3 },
      { code: 'EC3601', name: 'Antennas and Microwave', credits: 4 },
      { code: 'EC3691', name: 'Microprocessors', credits: 3 },
      { code: 'MX3082', name: 'Elements of Aeronautics', credits: 0 }
    ],
    7: [
      { code: 'EC3701', name: 'Optical Communication', credits: 3 },
      { code: 'EC3791', name: 'Ad Hoc and Wireless Sensor', credits: 3 },
      { code: 'GE3791', name: 'Management Science', credits: 2 },
      { code: 'EC3751', name: 'Advanced Digital Signal', credits: 3 },
      { code: 'MX3084', name: 'Disaster Management', credits: 0 }
    ],
    8: [
      { code: 'EC3801', name: 'Project Work', credits: 10 }
    ]
  },
  'MCA': {
    1: [
      { code: 'MC4101', name: 'Advanced Data Structures', credits: 3 },
      { code: 'MC4102', name: 'Database Technologies', credits: 3 },
      { code: 'MC4103', name: 'Cloud Computing Technologies', credits: 3 },
      { code: 'MC4104', name: 'Artificial Intelligence', credits: 3 },
      { code: 'RM4151', name: 'Research Methodology', credits: 2 }
    ],
    2: [
      { code: 'MC4201', name: 'Full Stack Web Development', credits: 4 },
      { code: 'MC4202', name: 'Advanced Java Programming', credits: 3 },
      { code: 'MC4203', name: 'Mobile Application Development', credits: 3 },
      { code: 'MC4204', name: 'Internet of Things', credits: 3 },
      { code: 'MC4205', name: 'Cyber Security', credits: 3 }
    ],
    3: [
      { code: 'MC4301', name: 'Machine Learning', credits: 3 },
      { code: 'MC4302', name: 'Big Data Analytics', credits: 3 },
      { code: 'MC4303', name: 'Software Project Management', credits: 3 },
      { code: 'MC4304', name: 'Professional Ethics', credits: 3 },
      { code: 'MC4305', name: 'Deep Learning', credits: 3 }
    ],
    4: [
      { code: 'MC4401', name: 'Project Work', credits: 12 }
    ]
  }
};

// --- HELPER FOR FULL CURRICULUM ACCESS ---
// Generates fallback data for other departments to ensure 8 semesters exist
export const getSubjectsForSem = (deptId: string, sem: number): SubjectDef[] => {
  if (CURRICULUM[deptId] && CURRICULUM[deptId][sem]) {
    return CURRICULUM[deptId][sem];
  }
  // Procedural generation for unmapped depts/semesters
  const subjects = [
    { code: `${deptId}${sem}01`, name: `Advanced ${deptId} Theory - ${sem}`, credits: 4 },
    { code: `${deptId}${sem}02`, name: `Applied ${deptId} Systems - ${sem}`, credits: 3 },
    { code: `${deptId}${sem}03`, name: `${deptId} Core Concepts - ${sem}`, credits: 3 },
    { code: `${deptId}${sem}04`, name: `Elective: ${deptId} Specialization`, credits: 3 },
    { code: `${deptId}${sem}05`, name: `${deptId} Laboratory Practice`, credits: 2 },
  ];
  return subjects;
};

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

// Clean State: No records
export const INITIAL_STAFF: StaffProfile[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_PARENTS: ParentProfile[] = [];
