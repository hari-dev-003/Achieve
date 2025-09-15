import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import RecommendationCard from '../../components/RecommendationCard';
import toast from 'react-hot-toast';

const StudentRecommendations = () => {
    const { studentDetails } = useOutletContext();
    const [recommendations, setRecommendations] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Entrance animation for the page
        window.anime({
            targets: '.rec-hub',
            translateY: [-20, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutExpo'
        });
    }, []);

    useEffect(() => {
        // Animate recommendation cards when they appear
        if (recommendations) {
            window.anime({ targets: '.recommendation-card', translateY: [20, 0], opacity: [0, 1], delay: window.anime.stagger(100), easing: 'easeOutExpo' });
        }
    }, [recommendations]);

    const handleGetRecommendations = async () => {
        if (!studentDetails || !studentDetails.skillSet || studentDetails.skillSet.length === 0) {
            toast.error("Get more achievements verified to build your skill profile and receive recommendations!");
            return;
        }
        setIsLoading(true);
        setRecommendations(null);
        setError('');

        const skills = studentDetails.skillSet.join(', ');
        const prompt = `Based on the skills [${skills}], suggest relevant learning opportunities for a ${studentDetails.year} ${studentDetails.department} student.

        Your response must be a valid JSON object with three keys: "courses", "competitions", and "projects".

        - "courses": Provide 2 relevant online courses.
        - "competitions": Use Google Search to find 2 famous, currently active or upcoming hackathons or coding competitions relevant to the student's skills. Prioritize platforms like Unstop, Devfolio, Hack2Skill, Major League Hacking (MLH), and official Google or Microsoft events. For each, include the platform name in the description.
        - "projects": Provide 1 interesting project idea.

        Each key ("courses", "competitions", "projects") should be an array of objects, where each object has "title", "description", and "link" properties. Ensure all links are valid URLs.`;
        
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
            const parsedRecs = JSON.parse(jsonText);
            setRecommendations(parsedRecs);

        } catch (err) {
            console.error("Failed to get recommendations:", err);
            setError("Could not fetch recommendations at this time. The AI might be busy or the response was not in the correct format. Please try again in a moment.");
            toast.error("Failed to fetch recommendations.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="rec-hub bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Recommendations Hub</h1>
                <p className="text-gray-400 text-sm mb-6">Based on your verified skills, here are some personalized recommendations to help you grow. Your current skills: <span className="text-cyan-400">{studentDetails?.skillSet?.join(', ') || 'None yet'}</span></p>
                <button onClick={handleGetRecommendations} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-lg disabled:bg-indigo-800 disabled:cursor-not-allowed">
                    {isLoading ? 'Generating...' : 'Get Personalized Recommendations'}
                </button>
            </div>

            <div className="mt-8">
                {isLoading && <Spinner />}
                {error && <p className="text-center text-red-400">{error}</p>}
                {recommendations && (
                    <div className="space-y-8">
                        {recommendations.courses && (
                            <div>
                                <h3 className="text-xl font-bold text-cyan-400 mb-4">Recommended Courses</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {recommendations.courses.map((item, index) => <RecommendationCard key={`course-${index}`} item={item} type="Course" />)}
                                </div>
                            </div>
                        )}
                         {recommendations.competitions && (
                            <div>
                                <h3 className="text-xl font-bold text-yellow-400 mb-4">Upcoming Competitions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {recommendations.competitions.map((item, index) => <RecommendationCard key={`comp-${index}`} item={item} type="Competition" />)}
                                </div>
                            </div>
                        )}
                         {recommendations.projects && (
                            <div>
                                <h3 className="text-xl font-bold text-indigo-400 mb-4">Project Ideas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {recommendations.projects.map((item, index) => <RecommendationCard key={`proj-${index}`} item={item} type="Project" />)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentRecommendations;

