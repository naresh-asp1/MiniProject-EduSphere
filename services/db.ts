

import { supabase, isSupabaseConfigured } from './supabase';
import { Student, StaffProfile, ParentProfile, ChangeRequest, Department, INITIAL_DEPARTMENTS, Course } from '../types';

// Force usage of DB if configured, only fall back on catastrophic failure
const USE_DB = isSupabaseConfigured();

const LS_KEYS = {
    STUDENTS: 'edusphere_students_v2',
    STAFF: 'edusphere_staff_v2',
    PARENTS: 'edusphere_parents_v2',
    REQUESTS: 'edusphere_requests_v2',
    DEPTS: 'edusphere_depts_v2',
    SUBJECTS: 'edusphere_subjects_v2'
};

let isDbCircuitOpen = false;

const getLS = <T>(key: string, def: T): T => {
    try {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : def;
    } catch { return def; }
};

const setLS = (key: string, val: any) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// --- MAPPERS ---
const mapStudentFromDB = (data: any): Student => ({
    id: data.id,
    name: data.name,
    email: data.email,
    photo: data.photo,
    dob: data.dob,
    batch: data.batch,
    currentSemester: data.current_semester,
    grade: data.grade,
    section: data.section,
    department: data.department,
    contactNumber: data.contact_number,
    address: data.address,
    residenceType: data.residence_type,
    tutorId: data.tutor_id,
    parentId: data.parent_id,
    feesPaid: data.fees_paid || false,
    verified: data.verified,
    marks: data.marks || [],
    attendanceLog: data.attendance_log || [],
    attendancePercentage: data.attendance_percentage || 0,
    backlogs: data.backlogs || [],
    performanceReport: data.performance_report || '',
    cgpa: data.cgpa || 0
});

const mapStudentToDB = (student: Student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    photo: student.photo,
    dob: student.dob,
    batch: student.batch,
    current_semester: student.currentSemester,
    grade: student.grade,
    section: student.section,
    department: student.department,
    contact_number: student.contactNumber,
    address: student.address,
    residence_type: student.residenceType,
    tutor_id: student.tutorId,
    parent_id: student.parentId,
    fees_paid: student.feesPaid,
    verified: student.verified,
    marks: student.marks,
    attendance_log: student.attendanceLog,
    attendance_percentage: student.attendancePercentage,
    backlogs: student.backlogs,
    performance_report: student.performanceReport,
    cgpa: student.cgpa
});

const mapStaffFromDB = (data: any): StaffProfile => ({
    id: data.id,
    name: data.name,
    email: data.email,
    photo: data.photo,
    department: data.department,
    allocatedSubjects: data.allocated_subjects || [],
    allocationStatus: data.allocation_status,
    isHod: data.is_hod
});

const mapStaffToDB = (staff: StaffProfile) => ({
    id: staff.id,
    name: staff.name,
    email: staff.email,
    photo: staff.photo,
    department: staff.department,
    allocated_subjects: staff.allocatedSubjects,
    allocation_status: staff.allocationStatus,
    is_hod: staff.isHod
});

const mapParentFromDB = (data: any): ParentProfile => ({
    id: data.id,
    name: data.name,
    email: data.email,
    studentId: data.student_id,
    contactNumber: data.contact_number
});

const mapParentToDB = (parent: ParentProfile) => ({
    id: parent.id,
    name: parent.name,
    email: parent.email,
    student_id: parent.studentId,
    contact_number: parent.contactNumber
});

const mapRequestFromDB = (data: any): ChangeRequest => ({
    id: data.id,
    studentId: data.student_id,
    studentName: data.student_name,
    field: data.field,
    oldValue: data.old_value,
    newValue: data.new_value,
    status: data.status,
    reason: data.reason
});

const mapRequestToDB = (req: ChangeRequest) => ({
    id: req.id,
    student_id: req.studentId,
    student_name: req.studentName,
    field: req.field,
    old_value: req.oldValue,
    new_value: req.newValue,
    status: req.status,
    reason: req.reason
});

const handleDBError = (context: string, error: any) => {
    const msg = error?.message || JSON.stringify(error);
    console.warn(`Supabase Error (${context}):`, msg);
    
    // Strict fallback: Only switch to LS if table is strictly missing or connection failed
    if (error?.code === '42P01' || error?.code === 'PGRST301' || error?.message?.includes('fetch')) { 
        console.error("CRITICAL: Database issue. Falling back to LocalStorage.");
        isDbCircuitOpen = true; 
    }
};

// --- CRUD OPERATIONS ---
export const db = {
    // STUDENTS
    async fetchStudents() {
        if (!USE_DB || isDbCircuitOpen) return getLS<Student[]>(LS_KEYS.STUDENTS, []);
        try {
            const { data, error } = await supabase.from('students').select('*');
            if (error) throw error;
            return data ? data.map(mapStudentFromDB) : [];
        } catch (e) {
            handleDBError('fetchStudents', e);
            return getLS<Student[]>(LS_KEYS.STUDENTS, []);
        }
    },
    async upsertStudent(student: Student) {
        // Fallback Logic
        const saveToLS = () => {
            const list = getLS<Student[]>(LS_KEYS.STUDENTS, []);
            const idx = list.findIndex(s => s.id === student.id);
            if (idx >= 0) list[idx] = student; else list.push(student);
            setLS(LS_KEYS.STUDENTS, list);
        };

        if (!USE_DB || isDbCircuitOpen) {
            saveToLS(); return true;
        }
        try {
            await supabase.from('students').upsert(mapStudentToDB(student));
            return true;
        } catch (e) { 
            handleDBError('upsertStudent', e); 
            // CRITICAL FIX: Fallback to LS on DB failure
            saveToLS();
            return true; 
        }
    },
    async bulkUpsertStudents(students: Student[]) {
        const saveToLS = () => {
             const list = getLS<Student[]>(LS_KEYS.STUDENTS, []);
            students.forEach(s => {
                const idx = list.findIndex(ex => ex.id === s.id);
                if (idx >= 0) list[idx] = s; else list.push(s);
            });
            setLS(LS_KEYS.STUDENTS, list);
        };

        if (!USE_DB || isDbCircuitOpen) {
            saveToLS(); return true;
        }
        try {
            await supabase.from('students').upsert(students.map(mapStudentToDB));
            return true;
        } catch (e) { 
            handleDBError('bulkUpsertStudents', e); 
            saveToLS();
            return true; 
        }
    },
    async deleteStudent(id: string) {
        const deleteFromLS = () => {
             const list = getLS<Student[]>(LS_KEYS.STUDENTS, []);
            setLS(LS_KEYS.STUDENTS, list.filter(s => s.id !== id));
        };

        if (!USE_DB || isDbCircuitOpen) {
            deleteFromLS(); return true;
        }
        try {
            await supabase.from('students').delete().eq('id', id);
            return true;
        } catch (e) { 
            handleDBError('deleteStudent', e); 
            deleteFromLS();
            return true; 
        }
    },

    // STAFF
    async fetchStaff() {
        if (!USE_DB || isDbCircuitOpen) return getLS<StaffProfile[]>(LS_KEYS.STAFF, []);
        try {
            const { data, error } = await supabase.from('staff').select('*');
            if (error) throw error;
            return data ? data.map(mapStaffFromDB) : [];
        } catch (e) {
            handleDBError('fetchStaff', e);
            return getLS<StaffProfile[]>(LS_KEYS.STAFF, []);
        }
    },
    async upsertStaff(staff: StaffProfile) {
        const saveToLS = () => {
            const list = getLS<StaffProfile[]>(LS_KEYS.STAFF, []);
            const idx = list.findIndex(s => s.id === staff.id);
            if (idx >= 0) list[idx] = staff; else list.push(staff);
            setLS(LS_KEYS.STAFF, list);
        };

        if (!USE_DB || isDbCircuitOpen) {
            saveToLS(); return true;
        }
        try {
            await supabase.from('staff').upsert(mapStaffToDB(staff));
            return true;
        } catch (e) { 
            handleDBError('upsertStaff', e); 
            saveToLS();
            return true; 
        }
    },
    async deleteStaff(id: string) {
        const deleteFromLS = () => {
             const list = getLS<StaffProfile[]>(LS_KEYS.STAFF, []);
            setLS(LS_KEYS.STAFF, list.filter(s => s.id !== id));
        };

        if (!USE_DB || isDbCircuitOpen) {
            deleteFromLS(); return true;
        }
        try {
            await supabase.from('staff').delete().eq('id', id);
            return true;
        } catch (e) { 
            handleDBError('deleteStaff', e); 
            deleteFromLS();
            return true; 
        }
    },

    // PARENTS
    async fetchParents() {
        if (!USE_DB || isDbCircuitOpen) return getLS<ParentProfile[]>(LS_KEYS.PARENTS, []);
        try {
            const { data, error } = await supabase.from('parents').select('*');
            if (error) throw error;
            return data ? data.map(mapParentFromDB) : [];
        } catch (e) {
            handleDBError('fetchParents', e);
            return getLS<ParentProfile[]>(LS_KEYS.PARENTS, []);
        }
    },
    async upsertParent(parent: ParentProfile) {
        const saveToLS = () => {
             const list = getLS<ParentProfile[]>(LS_KEYS.PARENTS, []);
            const idx = list.findIndex(s => s.id === parent.id);
            if (idx >= 0) list[idx] = parent; else list.push(parent);
            setLS(LS_KEYS.PARENTS, list);
        };
        if (!USE_DB || isDbCircuitOpen) {
            saveToLS(); return true;
        }
        try {
            await supabase.from('parents').upsert(mapParentToDB(parent));
            return true;
        } catch (e) { 
            handleDBError('upsertParent', e); 
            saveToLS();
            return true; 
        }
    },
    async deleteParent(id: string) {
        const deleteFromLS = () => {
            const list = getLS<ParentProfile[]>(LS_KEYS.PARENTS, []);
            setLS(LS_KEYS.PARENTS, list.filter(s => s.id !== id));
        };
        if (!USE_DB || isDbCircuitOpen) {
            deleteFromLS(); return true;
        }
        try {
            await supabase.from('parents').delete().eq('id', id);
            return true;
        } catch (e) { 
            handleDBError('deleteParent', e); 
            deleteFromLS();
            return true; 
        }
    },

    // DEPARTMENTS
    async fetchDepartments() {
        if (!USE_DB || isDbCircuitOpen) return getLS<Department[]>(LS_KEYS.DEPTS, INITIAL_DEPARTMENTS);
        try {
            const { data, error } = await supabase.from('departments').select('*');
            if (error) throw error;
            return data as Department[];
        } catch (e) {
            handleDBError('fetchDepartments', e);
            return getLS<Department[]>(LS_KEYS.DEPTS, INITIAL_DEPARTMENTS);
        }
    },
    async addDepartment(dept: Department) {
        const saveToLS = () => {
            const list = getLS<Department[]>(LS_KEYS.DEPTS, INITIAL_DEPARTMENTS);
            list.push(dept);
            setLS(LS_KEYS.DEPTS, list);
        };
        if (!USE_DB || isDbCircuitOpen) {
            saveToLS(); return true;
        }
        try {
            await supabase.from('departments').insert(dept);
            return true;
        } catch (e) { 
            handleDBError('addDepartment', e); 
            saveToLS();
            return true; 
        }
    },

    // SUBJECTS - ENHANCED WITH MERGE STRATEGY
    async fetchSubjects() {
        const localData = getLS<Course[]>(LS_KEYS.SUBJECTS, []);
        
        if (!USE_DB || isDbCircuitOpen) {
            return localData;
        }

        try {
            const { data, error } = await supabase.from('subjects').select('*');
            if (error) throw error;
            
            const dbData = data as Course[];
            
            // SMART MERGE: Combine DB data with Local data to avoid data loss during flaky connections
            const merged = [...dbData];
            localData.forEach(localSub => {
                if (!merged.find(d => d.code === localSub.code)) {
                    merged.push(localSub);
                }
            });
            
            return merged.map(s => ({...s, type: s.type || 'Theory'}));
        } catch (e) {
            handleDBError('fetchSubjects', e);
            return localData.map(s => ({...s, type: s.type || 'Theory'}));
        }
    },
    async addSubject(subject: Course) {
        const saveToLS = () => {
            const list = getLS<Course[]>(LS_KEYS.SUBJECTS, []);
            const idx = list.findIndex(s => s.code === subject.code);
            if (idx >= 0) list[idx] = subject; else list.push(subject);
            setLS(LS_KEYS.SUBJECTS, list);
        };

        // Always save to LS first for immediate redundancy
        saveToLS();

        if (!USE_DB || isDbCircuitOpen) {
            return true;
        }
        
        try {
            await supabase.from('subjects').upsert(subject);
            return true;
        } catch (e) { 
            handleDBError('addSubject', e); 
            // Already saved to LS above, so we are safe
            return true; 
        }
    },
    async deleteSubject(code: string) {
        const deleteFromLS = () => {
             const list = getLS<Course[]>(LS_KEYS.SUBJECTS, []);
            setLS(LS_KEYS.SUBJECTS, list.filter(s => s.code !== code));
        };
        
        deleteFromLS();

        if (!USE_DB || isDbCircuitOpen) {
            return true;
        }
        try {
            await supabase.from('subjects').delete().eq('code', code);
            return true;
        } catch (e) { 
            handleDBError('deleteSubject', e); 
            return true; 
        }
    },

    // REQUESTS
    async fetchRequests() {
        if (!USE_DB || isDbCircuitOpen) return getLS<ChangeRequest[]>(LS_KEYS.REQUESTS, []);
        try {
            const { data, error } = await supabase.from('change_requests').select('*');
            if (error) throw error;
            return data ? data.map(mapRequestFromDB) : [];
        } catch (e) {
            handleDBError('fetchRequests', e);
            return getLS<ChangeRequest[]>(LS_KEYS.REQUESTS, []);
        }
    },
    async upsertRequest(req: ChangeRequest) {
        const saveToLS = () => {
            const list = getLS<ChangeRequest[]>(LS_KEYS.REQUESTS, []);
            const idx = list.findIndex(s => s.id === req.id);
            if (idx >= 0) list[idx] = req; else list.push(req);
            setLS(LS_KEYS.REQUESTS, list);
        };
        if (!USE_DB || isDbCircuitOpen) {
            saveToLS(); return true;
        }
        try {
            await supabase.from('change_requests').upsert(mapRequestToDB(req));
            return true;
        } catch (e) { 
            handleDBError('upsertRequest', e); 
            saveToLS();
            return true; 
        }
    }
};
