

import { GoogleGenAI } from "@google/genai";
import { Student, Course } from "../types";

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

export const extractCurriculumFromImage = async (base64Image: string, department: string): Promise<Course[]> => {
    if (!apiKey) throw new Error("API Key Missing");

    // Remove header if present (data:image/png;base64,...)
    const base64Data = base64Image.split(',')[1] || base64Image;

    const prompt = `
        Analyze this image of an academic curriculum/syllabus. 
        Extract a list of subjects with the following fields:
        - code (Course Code, e.g., CS3301)
        - name (Course Name)
        - credits (Number, default to 3 if not found)
        - semester (Number, try to infer from context, default to 1)
        - type (Either "Theory" or "Lab". If it contains words like 'Laboratory', 'Practical', or 'Lab', mark as "Lab". Otherwise "Theory")
        
        The department is ${department}.
        
        Return STRICTLY a JSON array of objects. Do not include markdown formatting or backticks.
        Example: [{"code": "CS101", "name": "Intro to CS", "credits": 3, "semester": 1, "department": "${department}", "type": "Theory"}]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        const text = response.text || '';
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        
        return parsed.map((p: any) => ({
            ...p,
            department: department, 
            credits: Number(p.credits) || 3,
            semester: Number(p.semester) || 1,
            type: p.type || 'Theory'
        }));

    } catch (error) {
        console.error("Gemini Vision Error:", error);
        throw new Error("Failed to extract curriculum data from image.");
    }
};

export const extractCurriculumFromText = async (syllabusText: string, department: string): Promise<Course[]> => {
    if (!apiKey) throw new Error("API Key Missing");

    const prompt = `
        Analyze the following text extracted from a curriculum document/syllabus.
        Extract a list of subjects with these fields:
        - code (Course Code)
        - name (Course Name)
        - credits (Number, default 3)
        - semester (Number, default 1)
        - type (Either "Theory" or "Lab". Check course name for keywords like 'Lab', 'Practical', 'Laboratory' to assign "Lab". Default "Theory")

        The department is ${department}.
        
        Return STRICTLY a JSON array of objects. No markdown.
        
        TEXT CONTENT:
        ${syllabusText.substring(0, 10000)} 
        // Truncated to avoid token limits, ensure key parts are processed
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const text = response.text || '';
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        
        return parsed.map((p: any) => ({
            ...p,
            department: department, 
            credits: Number(p.credits) || 3,
            semester: Number(p.semester) || 1,
            type: p.type || 'Theory'
        }));
    } catch (error) {
        console.error("Gemini Text API Error:", error);
        throw new Error("Failed to extract curriculum from text.");
    }
};
