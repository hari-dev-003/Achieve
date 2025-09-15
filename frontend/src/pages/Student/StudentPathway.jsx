import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';
import RoadmapNode from '../../components/RoadmapNode'; // Import the new component
import PathwayStep from '../../components/PathwayStep'; // Also used for other sections

// --- Main Career Pathway Page ---
const StudentPathway = () => {
    const { studentDetails } = useOutletContext();
    const [goal, setGoal] = useState('');
    const [pathway, setPathway] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        window.anime({ targets: '.pathway-hub', translateY: [-20, 0], opacity: [0, 1], duration: 800, easing: 'easeOutExpo' });
    }, []);

    useEffect(() => {
        if (pathway) {
            window.anime({
                targets: '.pathway-section, .roadmap-item, .pathway-item',
                translateY: [20, 0],
                opacity: [0, 1],
                delay: window.anime.stagger(80),
                easing: 'easeOutExpo'
            });
        }
    }, [pathway]);

    const handleGeneratePathway = async () => {
        if (!goal.trim()) {
            toast.error("Please enter a career goal to generate a pathway.");
            return;
        }
        setIsLoading(true);
        setPathway(null);
        setError('');

        const skills = studentDetails?.skillSet?.map(s => s.toLowerCase()) || [];
        const prompt = `I am a ${studentDetails.year} ${studentDetails.department} student with existing skills in [${skills.join(', ')}]. My career goal is to become a "${goal}".

        Generate a detailed, step-by-step roadmap for me. The response must be a valid JSON object with the following keys: "roadmap", "learningResources", "projectMilestones", and "peerFinderMessage".

        - "roadmap": An array of objects, where each object represents a stage (e.g., "Fundamentals", "Advanced Topics"). Each stage object must have a "title" (string) and a "topics" (array of strings) property. The topics should be specific skills or technologies.
        - "learningResources": An array of 2 objects, each representing a specific online course with "title", "description", and "link" properties.
        - "projectMilestones": An array of 2 objects, each a mini-project idea with "title" and "description" properties.
        - "peerFinderMessage": A short, compelling message (as a string) that I can use to find teammates based on my goal.

        Use Google Search for real-time, relevant information. Ensure the entire output is a single, valid JSON object.`;

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    tools: [{ "google_search": {} }]
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            
            const result = await response.json();
            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            const jsonText = rawText.match(/{[\s\S]*}/)[0];
            const parsedPathway = JSON.parse(jsonText);
            setPathway(parsedPathway);

        } catch (err) {
            console.error("Failed to generate pathway:", err);
            setError("Could not generate a pathway at this time. The AI might be busy or the response was not in the correct format. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const studentSkillsLower = studentDetails?.skillSet?.map(s => s.toLowerCase()) || [];

    return (
        <div>
            <div className="pathway-hub bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">AI-Powered Career Roadmap</h1>
                <p className="text-gray-400 text-sm mb-6">Enter your career goal, and our AI will generate a personalized, visual roadmap to guide you, checking off the skills you already possess.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., AI & Machine Learning Engineer"
                        className="flex-grow bg-gray-700 border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={handleGeneratePathway} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-lg disabled:bg-indigo-800 disabled:cursor-not-allowed">
                        {isLoading ? <Spinner /> : 'Generate Roadmap'}
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {isLoading && <Spinner />}
                {error && <p className="text-center text-red-400">{error}</p>}
                {pathway && (
                    <div className="space-y-8">
                        {/* Visual Roadmap */}
                        <div className="pathway-section opacity-0">
                            <h3 className="text-2xl font-bold text-yellow-400 mb-6">Your Personalized Roadmap</h3>
                            <div className="flex flex-col">
                                {pathway.roadmap.map((stage, stageIndex) => (
                                    <div key={stageIndex} className="mb-6">
                                        <h4 className="font-bold text-lg text-white mb-4 pl-1 md:pl-8">{stage.title}</h4>
                                        <div className="space-y-2 relative">
                                            {/* Vertical line for desktop */}
                                            <div className="hidden md:block absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-600"></div>
                                            {stage.topics.map((topic, topicIndex) => (
                                                <RoadmapNode 
                                                    key={topicIndex} 
                                                    topic={topic} 
                                                    isCompleted={studentSkillsLower.includes(topic.toLowerCase())}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Other Sections */}
                         <div className="pathway-section opacity-0">
                             <h3 className="text-xl font-bold text-cyan-400 mb-4">Learning Resources</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pathway.learningResources.map((item, index) => <PathwayStep key={index} item={item} type="Course" icon="🎓" color="cyan" />)}
                             </div>
                        </div>
                        
                         <div className="pathway-section opacity-0">
                             <h3 className="text-xl font-bold text-green-400 mb-4">Project Milestones</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pathway.projectMilestones.map((item, index) => <PathwayStep key={index} item={item} type="Project" icon="🛠️" color="green" />)}
                             </div>
                        </div>

                        <div className="pathway-section opacity-0">
                            <h3 className="text-xl font-bold text-purple-400 mb-4">Find Teammates</h3>
                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                                <p className="text-sm text-gray-300 italic">"{pathway.peerFinderMessage}"</p>
                                <Link 
                                    to="/student-dashboard/find-teammates"
                                    state={{ peerFinderMessage: pathway.peerFinderMessage, goal: goal }}
                                    className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Post this on the Teammate Finder board &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPathway;

