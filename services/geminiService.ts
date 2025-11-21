import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateStudentReport = async (student: Student): Promise<string> => {
  if (!apiKey) return "API Key is missing. Cannot generate report.";

  const prompt = `
    You are a senior academic counselor. Write a concise but professional Annual Performance Report (approx 50-75 words) for a student based on the following data.
    
    Student Name: ${student.name}
    Grade: ${student.grade}
    Attendance: ${student.attendancePercentage}%
    
    Marks:
    - Math: ${student.marks.math}
    - Science: ${student.marks.science}
    - English: ${student.marks.english}
    - History: ${student.marks.history}
    - Computer Science: ${student.marks.computer}
    
    Highlight strengths and areas for improvement. Tone should be constructive and formal.
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
  const summaryData = students.map(s => ({
    name: s.name,
    avg: (s.marks.math + s.marks.science + s.marks.english + s.marks.history + s.marks.computer) / 5,
    attendance: s.attendancePercentage
  }));

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
