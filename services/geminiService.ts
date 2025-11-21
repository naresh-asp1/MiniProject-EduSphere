
import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateStudentReport = async (student: Student): Promise<string> => {
  if (!apiKey) return "API Key is missing. Cannot generate report.";

  const marksSummary = student.marks.map(m => `${m.code} (${m.name}): ${m.score}`).join('\n');

  const prompt = `
    You are a senior academic counselor. Write a concise but professional Annual Performance Report (approx 50-75 words) for a student based on the following data.
    
    Student Name: ${student.name}
    Roll No: ${student.id}
    Department: ${student.department} - Sem ${student.currentSemester}
    Attendance: ${student.attendancePercentage}%
    
    Marks Obtained:
    ${marksSummary}
    
    Highlight strengths and areas for improvement based on the subjects provided. Tone should be constructive and formal.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating report due to API limitations.";
  }
};

export const analyzeClassPerformance = async (students: Student[]): Promise<string> => {
  if (!apiKey) return "API Key is missing.";

  // Summarize data to save tokens
  const summaryData = students.map(s => {
    const totalScore = s.marks.reduce((acc, m) => acc + m.score, 0);
    const avg = s.marks.length > 0 ? totalScore / s.marks.length : 0;
    return {
      name: s.name,
      rollNo: s.id,
      avgScore: avg.toFixed(1),
      attendance: s.attendancePercentage
    };
  });

  const prompt = `
    Analyze the following class performance data summary. 
    Data: ${JSON.stringify(summaryData)}
    
    Provide a brief executive summary (bullet points) for the Principal covering:
    1. Overall Class Average
    2. Top Performer
    3. Students needing attention (low attendance or low average)
    4. General trend.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing data.";
  }
};
