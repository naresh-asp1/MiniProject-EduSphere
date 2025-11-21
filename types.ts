
export enum Role {
  ADMIN1 = 'admin1',
  ADMIN2 = 'admin2',
  STAFF = 'staff',
  STUDENT = 'student'
}

export const DEFAULT_CREDS = {
  ADMIN1: { user: 'admin1', pass: 'admin123' },
  ADMIN2: { user: 'admin2', pass: 'admin223' },
  STAFF_PASS: 'staff123',
  STUDENT_PASS: 'student123'
};

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  department?: string;
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
  id: string; // Roll No: Year + Dept + Seq (e.g., 2021CSE001)
  name: string;
  email: string;
  dob: string;
  batch: number; // Join Year
  currentSemester: number; // 1-8
  grade: string; // Year (e.g. I Year, II Year)
  section: string;
  department: string;
  contactNumber: string;
  address: string;
  residenceType: 'Hosteller' | 'Day Scholar'; // New field
  verified: boolean;
  marks: SubjectMark[]; // Dynamic subjects based on Sem/Dept
  attendanceLog: AttendanceRecord[];
  attendancePercentage: number;
  backlogs: string[]; // Subject Codes
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
  department: string;
  allocatedSubjects: string[]; // Course Codes assigned to this staff
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

// --- CURRICULUM DATA (Anna University Style Pattern) ---

interface SubjectDef { code: string; name: string; credits: number; }

// Mapping: Dept -> Semester -> Subjects
export const CURRICULUM: Record<string, Record<number, SubjectDef[]>> = {
  'CSE': {
    1: [
      { code: 'HS3151', name: 'Professional English - I', credits: 3 },
      { code: 'MA3151', name: 'Matrices and Calculus', credits: 4 },
      { code: 'PH3151', name: 'Engineering Physics', credits: 3 },
      { code: 'CY3151', name: 'Engineering Chemistry', credits: 3 },
      { code: 'GE3151', name: 'Problem Solving & Python', credits: 3 }
    ],
    3: [
      { code: 'MA3354', name: 'Discrete Mathematics', credits: 4 },
      { code: 'CS3301', name: 'Data Structures', credits: 3 },
      { code: 'CS3351', name: 'Digital Principles', credits: 4 },
      { code: 'CS3391', name: 'Object Oriented Programming', credits: 3 },
      { code: 'CD3291', name: 'Data Structures & Alg.', credits: 3 }
    ],
    5: [
      { code: 'CS3501', name: 'Compiler Design', credits: 4 },
      { code: 'CS3591', name: 'Computer Networks', credits: 3 },
      { code: 'CS3551', name: 'Distributed Systems', credits: 3 },
      { code: 'CCS334', name: 'Big Data Analytics', credits: 3 },
      { code: 'CCS375', name: 'Web Technology', credits: 3 }
    ],
    7: [
      { code: 'GE3791', name: 'Human Values and Ethics', credits: 2 },
      { code: 'CS3701', name: 'Cloud Computing', credits: 3 },
      { code: 'CS3791', name: 'Cryptography & Security', credits: 3 },
      { code: 'CCS356', name: 'Object Oriented Analysis', credits: 3 },
      { code: 'CS3711', name: 'Mechatronics', credits: 3 }
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
    3: [
      { code: 'MA3355', name: 'Transforms and PDE', credits: 4 },
      { code: 'EC3354', name: 'Signals and Systems', credits: 4 },
      { code: 'EC3353', name: 'Electronic Circuits I', credits: 3 },
      { code: 'EC3351', name: 'Control Systems', credits: 3 },
      { code: 'EC3352', name: 'Digital Electronics', credits: 3 }
    ],
    5: [
      { code: 'EC3501', name: 'Wireless Communication', credits: 3 },
      { code: 'EC3552', name: 'VLSI Design', credits: 3 },
      { code: 'EC3551', name: 'Transmission Lines', credits: 3 },
      { code: 'EC3591', name: 'Medical Electronics', credits: 3 },
      { code: 'CCS331', name: 'Embedded Systems', credits: 3 }
    ],
    7: [
      { code: 'EC3701', name: 'Optical Communication', credits: 3 },
      { code: 'EC3791', name: 'Ad Hoc and Wireless Sensor', credits: 3 },
      { code: 'GE3791', name: 'Management Science', credits: 2 },
      { code: 'EC3751', name: 'Advanced Digital Signal', credits: 3 },
      { code: 'MX3084', name: 'Disaster Management', credits: 0 }
    ]
  }
};

// Default fallback for departments not fully mapped above
const DEFAULT_SUBJECTS = [
    { code: 'GEN101', name: 'General Engineering', credits: 3 },
    { code: 'MAT101', name: 'Applied Mathematics', credits: 4 },
    { code: 'SCI101', name: 'Applied Sciences', credits: 3 },
    { code: 'ENG101', name: 'Communication Skills', credits: 3 },
    { code: 'PRJ101', name: 'Mini Project', credits: 2 }
];

// Helper to get subjects for any semester (handles missing map data)
const getSubjectsForSem = (deptId: string, sem: number): SubjectDef[] => {
  if (CURRICULUM[deptId] && CURRICULUM[deptId][sem]) {
    return CURRICULUM[deptId][sem];
  }
  // Generate generic subjects for unmapped semesters to ensure data exists for all sems
  return [
    { code: `${deptId}${sem}01`, name: `Advanced Mathematics ${sem}`, credits: 4 },
    { code: `${deptId}${sem}02`, name: `Core Departmental ${sem}-A`, credits: 3 },
    { code: `${deptId}${sem}03`, name: `Core Departmental ${sem}-B`, credits: 3 },
    { code: `${deptId}${sem}04`, name: `Elective Subject ${sem}`, credits: 3 },
    { code: `${deptId}${sem}05`, name: `Practical Laboratory ${sem}`, credits: 2 },
  ];
};

// --- INITIAL DATA GENERATION ---

const DEPT_NAMES = [
  ['CSE', 'Computer Science & Eng'],
  ['ECE', 'Electronics & Communication'],
  ['MECH', 'Mechanical Engineering'],
  ['CIVIL', 'Civil Engineering'],
  ['IT', 'Information Technology'],
  ['AI', 'Artificial Intelligence & DS'],
  ['EEE', 'Electrical & Electronics'],
  ['BME', 'Biomedical Engineering'],
  ['CHEM', 'Chemical Engineering'],
  ['MBA', 'Business Administration']
];

export const INITIAL_DEPARTMENTS: Department[] = DEPT_NAMES.map(d => ({ id: d[0], name: d[1] }));

// South Indian Names (First names only)
const SI_NAMES = [
  "Aditya", "Arjun", "Sai", "Krishna", "Karthik", "Vijay", "Surya", "Ravi", 
  "Lakshmi", "Priya", "Divya", "Anjali", "Kavya", "Swathi", "Rahul", "Rohit", 
  "Sanjay", "Vikram", "Nithin", "Praveen", "Suresh", "Ramesh", "Manoj", "Deepak", 
  "Aishwarya", "Shruti", "Pooja", "Sneha", "Varun", "Tarun", "Naveen", "Harish", 
  "Girish", "Venkat", "Balaji", "Subramaniam", "Raman", "Krishnan", "Srinivas", 
  "Murugan", "Saravanan", "Kumar", "Anand", "Raj", "Mohan", "Chandran", "Senthil", 
  "Prabhu", "Ganesh", "Dinesh", "Meera", "Nithya", "Deepa", "Revathi", "Malini",
  "Siddharth", "Pranav", "Aravind", "Ashwin", "Vignesh", "Keerthana", "Gayathri",
  "Vaishnavi", "Abhishek", "Vishal", "Preethi", "Sangeetha", "Madhav", "Shankar"
];

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const generateStaff = (): StaffProfile[] => {
  const staff: StaffProfile[] = [];
  let counter = 1;
  INITIAL_DEPARTMENTS.forEach(dept => {
    // Gather all subjects for this department (from all semesters)
    const deptSubjects: SubjectDef[] = [];
    for(let s = 1; s <= 8; s++) {
        deptSubjects.push(...getSubjectsForSem(dept.id, s));
    }

    for (let i = 1; i <= 5; i++) {
      const name = getRandomElement(SI_NAMES);
      // Assign 2 random subjects from the dept curriculum to this staff
      const subjects = new Set<string>();
      if (deptSubjects.length > 0) {
        subjects.add(deptSubjects[Math.floor(Math.random() * deptSubjects.length)].code);
        subjects.add(deptSubjects[Math.floor(Math.random() * deptSubjects.length)].code);
      }

      staff.push({
        id: `ST${String(counter).padStart(3, '0')}`,
        name: `Prof. ${name}`,
        email: `${name.toLowerCase()}${counter}@edusphere.edu`,
        department: dept.id,
        allocatedSubjects: Array.from(subjects)
      });
      counter++;
    }
  });
  return staff;
};

export const INITIAL_STAFF: StaffProfile[] = generateStaff();

const generateStudents = (): Student[] => {
  const students: Student[] = [];
  const localities = ["Anna Nagar", "T. Nagar", "Adyar", "Velachery", "Tambaram", "Mylapore", "Chromepet", "Guindy", "Gandhipuram", "RS Puram", "Peelamedu"];
  const cities = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Erode"];

  INITIAL_DEPARTMENTS.forEach(dept => {
    const batches = [2024, 2023, 2022, 2021]; 
    
    batches.forEach((batchYear, batchIndex) => {
      const currentSem = (batchIndex * 2) + 1; // 1, 3, 5, 7
      
      // 3 students per batch per dept (Resulting in ~120 students total)
      for (let i = 1; i <= 3; i++) {
        if (students.filter(s => s.department === dept.id).length >= 12) break; // Cap at ~12 per dept

        const isVerified = Math.random() > 0.1;
        const isHosteller = Math.random() > 0.6; 
        const name = getRandomElement(SI_NAMES);
        const seqNo = String(i).padStart(3, '0');
        const rollNo = `${batchYear}${dept.id}${seqNo}`;

        let address = '';
        if (isHosteller) {
            address = `Hostel Block ${dept.id}, Room ${Math.floor(Math.random() * 200) + 100}, EduSphere Campus`;
        } else {
            address = `No. ${Math.floor(Math.random() * 100) + 1}, ${getRandomElement(localities)} Main Road, ${getRandomElement(cities)}`;
        }

        // GENERATE MARKS HISTORY (From Sem 1 up to Current Sem)
        const allMarks: SubjectMark[] = [];
        const backlogs: string[] = [];

        for (let s = 1; s <= currentSem; s++) {
            const semSubjects = getSubjectsForSem(dept.id, s);
            const semMarks = semSubjects.map(sub => {
                // Simple logic: older semesters likely passed, current semester might have random scores
                const isBacklog = Math.random() > 0.95; // 5% chance of fail per subject
                const score = isBacklog ? 40 : Math.floor(Math.random() * 40) + 60; 
                
                if (score < 50) backlogs.push(sub.code);

                return {
                    code: sub.code,
                    name: sub.name,
                    credits: sub.credits,
                    score: score,
                    semester: s
                };
            });
            allMarks.push(...semMarks);
        }

        students.push({
          id: rollNo,
          name: name,
          email: `${name.toLowerCase()}.${rollNo}@edusphere.edu`,
          dob: `${batchYear - 18}-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          batch: batchYear,
          currentSemester: currentSem,
          grade: `${['I', 'II', 'III', 'IV'][batchIndex]} Year`,
          section: ['A', 'B'][Math.floor(Math.random() * 2)],
          department: dept.id,
          contactNumber: `9${Math.floor(Math.random() * 900000000 + 100000000)}`,
          address: address,
          residenceType: isHosteller ? 'Hosteller' : 'Day Scholar',
          verified: isVerified,
          marks: allMarks,
          attendanceLog: [],
          attendancePercentage: Math.floor(Math.random() * 30) + 70,
          backlogs: backlogs,
          performanceReport: ''
        });
      }
    });
  });
  return students;
};

export const INITIAL_STUDENTS: Student[] = generateStudents();
