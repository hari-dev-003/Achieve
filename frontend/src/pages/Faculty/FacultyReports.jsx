import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';

// --- Reusable Component for Displaying Generated Reports ---
const ReportViewer = ({ title, content, onBack }) => (
    <div className="report-viewer bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-cyan-400">{title}</h3>
            <button onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">
                &larr; Back
            </button>
        </div>
        <div className="prose prose-invert max-w-none bg-gray-900/50 p-4 rounded-lg whitespace-pre-wrap">
            <p>{content}</p>
        </div>
        <button 
            onClick={() => { navigator.clipboard.writeText(content); toast.success("Report copied to clipboard!"); }}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
            Copy Report
        </button>
    </div>
);


// --- Main Reports Page Component ---
const FacultyReports = () => {
    const { facultyDetails } = useOutletContext();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [generatedReport, setGeneratedReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch students from the faculty member's assigned class
    useEffect(() => {
        if (!facultyDetails) return;

        const fetchStudents = async () => {
            try {
                const q = query(
                    collection(db, "users"),
                    where("role", "==", "student"),
                    where("department", "==", facultyDetails.department),
                    where("year", "==", facultyDetails.year),
                    where("section", "==", facultyDetails.section)
                );
                const querySnapshot = await getDocs(q);
                const studentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStudents(studentList);
            } catch (error) {
                console.error("Error fetching students:", error);
                toast.error("Could not fetch student list.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudents();
    }, [facultyDetails]);

    const handleGenerateReport = async (reportType) => {
        if (!selectedStudent) {
            toast.error("Please select a student first.");
            return;
        }
        setIsGenerating(true);
        const toastId = toast.loading(`Generating ${reportType}...`);

        try {
            // 1. Fetch all VERIFIED achievements for the selected student
            const achievementsQuery = query(
                collection(db, "achievements"),
                where("studentId", "==", selectedStudent.uid),
                where("status", "==", "verified")
            );
            const achievementsSnapshot = await getDocs(achievementsQuery);
            const achievements = achievementsSnapshot.docs.map(doc => doc.data());

            if (achievements.length === 0) {
                toast.error("This student has no verified achievements to report on.", { id: toastId });
                setIsGenerating(false);
                return;
            }

            // 2. Craft the AI Prompt
            const achievementsSummary = achievements.map(a => `- ${a.title}: ${a.description}`).join('\n');
            let prompt = `You are an academic advisor. Generate a professional document for a student named ${selectedStudent.name}.`;

            if (reportType === "Progress Report") {
                prompt += ` Create a concise progress report summarizing the student's key accomplishments based on the following verified achievements:\n\n${achievementsSummary}\n\nConclude with a positive, encouraging remark.`;
            } else if (reportType === "Recommendation Letter") {
                prompt += ` Create a strong, positive letter of recommendation. Highlight the student's skills and dedication as evidenced by these achievements:\n\n${achievementsSummary}\n\nStructure it as a formal letter from a faculty member of the ${facultyDetails.department} department.`;
            }

            // 3. Call the Gemini API
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            
            const result = await response.json();
            const reportContent = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!reportContent) throw new Error("AI did not return any content.");

            setGeneratedReport({ title: `${selectedStudent.name}'s ${reportType}`, content: reportContent });
            toast.success("Report generated successfully!", { id: toastId });

        } catch (error) {
            console.error("Error generating report:", error);
            toast.error(`Failed to generate report: ${error.message}`, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };
    
    if (isLoading) return <Spinner />;

    if (generatedReport) {
        return <ReportViewer title={generatedReport.title} content={generatedReport.content} onBack={() => setGeneratedReport(null)} />;
    }

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">AI-Powered Reporting</h1>
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Generate a Document</h2>
                <p className="text-sm text-gray-400 mb-6">Select a student from your class to generate a progress report or a draft letter of recommendation based on their verified achievements.</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <select
                            value={selectedStudent?.uid || ''}
                            onChange={(e) => {
                                const student = students.find(s => s.uid === e.target.value);
                                setSelectedStudent(student);
                            }}
                            className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="" disabled>Select a Student</option>
                            {students.map(s => <option key={s.uid} value={s.uid}>{s.name} - {s.email}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.144-.446 1.58 0L10 10.404l2.904-2.856c.436-.446 1.144-.446 1.58 0 .436.446.436 1.167 0 1.613l-3.72 3.655c-.436.446-1.144.446-1.58 0L5.516 9.16c-.436-.446-.436-1.167 0-1.613z"/></svg>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button onClick={() => handleGenerateReport("Progress Report")} disabled={isGenerating || !selectedStudent} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-cyan-800 disabled:cursor-not-allowed">
                        {isGenerating ? <Spinner /> : 'Generate Progress Report'}
                    </button>
                    <button onClick={() => handleGenerateReport("Recommendation Letter")} disabled={isGenerating || !selectedStudent} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-indigo-800 disabled:cursor-not-allowed">
                        {isGenerating ? <Spinner /> : 'Generate Recommendation Letter'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FacultyReports;
