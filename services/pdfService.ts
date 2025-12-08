

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Student } from "../types";

export const generateStudentPDF = (student: Student) => {
  const doc = new jsPDF();

  // Header Background
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, 210, 40, 'F');
  
  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("EduSphere", 14, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Student Performance Report", 14, 32);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 32);

  // Student Photo (Right Side of Header if available)
  if (student.photo) {
      try {
          doc.addImage(student.photo, 'JPEG', 180, 5, 20, 20);
      } catch (e) {
          // Fallback if image format not supported or invalid
          console.warn("Could not add image to PDF", e);
      }
  }

  // 1. Personal Details Section
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Personal Profile", 14, 55);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 58, 196, 58);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Left Column
  doc.text(`Name:`, 14, 68);
  doc.text(student.name, 40, 68);
  
  doc.text(`Roll No:`, 14, 75);
  doc.text(student.id, 40, 75);
  
  doc.text(`Department:`, 14, 82);
  doc.text(student.department, 40, 82);
  
  doc.text(`Batch:`, 14, 89);
  doc.text(student.batch.toString(), 40, 89);

  // Right Column
  doc.text(`Email:`, 110, 68);
  doc.text(student.email, 135, 68);
  
  doc.text(`Contact:`, 110, 75);
  doc.text(student.contactNumber, 135, 75);
  
  doc.text(`Residence:`, 110, 82);
  doc.text(student.residenceType, 135, 82);
  
  doc.text(`Tutor ID:`, 110, 89);
  doc.text(student.tutorId || 'Unassigned', 135, 89);

  // 2. Academic Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Academic Overview", 14, 105);
  doc.line(14, 108, 196, 108);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`Current Semester: ${student.currentSemester}`, 14, 118);
  doc.text(`Attendance Percentage: ${student.attendancePercentage}%`, 80, 118);
  doc.text(`CGPA: ${student.cgpa || '0.0'}`, 150, 118);

  // 3. Performance Report Content
  if (student.performanceReport) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Performance Remarks:", 14, 130);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      
      const splitText = doc.splitTextToSize(student.performanceReport, 180);
      doc.text(splitText, 14, 138);
  }

  // 4. Marks Table
  // Check pass/fail based on semester mark
  const isPg = ['MBA', 'MCA'].includes(student.department);
  const passMark = isPg ? 50 : 40;

  const tableData = student.marks.map(m => {
      const isPass = (m.semesterExam >= passMark) && (m.gradeLabel !== 'RA' && m.gradeLabel !== 'U');
      return [
        m.code,
        m.name,
        m.semester.toString(),
        m.credits.toString(),
        m.semesterExam.toString(), // Added Sem Mark column
        (m.total || m.score).toString(),
        m.gradeLabel || '-',
        isPass ? 'PASS' : 'FAIL'
      ];
  });

  // Calculate start Y based on report text length
  let tableStartY = student.performanceReport ? 160 : 135;

  autoTable(doc, {
    startY: tableStartY,
    head: [['Code', 'Subject', 'Sem', 'Credits', 'Sem Mark', 'Total', 'Grade', 'Result']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
    },
    columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 7) {
            if (data.cell.raw === 'FAIL') {
                data.cell.styles.textColor = [220, 38, 38]; // Red
            } else {
                data.cell.styles.textColor = [22, 163, 74]; // Green
            }
        }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`EduSphere Management System - Confidential Report`, 14, 285);
    doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
  }

  doc.save(`${student.id}_PerformanceReport.pdf`);
};
