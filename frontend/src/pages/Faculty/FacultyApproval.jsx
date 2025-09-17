import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { auth, db } from '../../firebaseconfig';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { sha256 } from 'js-sha256';
import Spinner from '../../components/Spinner';

// --- Rejection Feedback Modal Component (Re-used from previous dashboard) ---
const RejectionModal = ({ achievement, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) {
            alert('Please provide a reason for rejection.');
            return;
        }
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md animate-fade-in-up">
                <h2 className="text-xl font-bold text-white mb-4">Reject Achievement</h2>
                <p className="text-sm text-gray-400 mb-2">You are about to reject the achievement: <span className="font-semibold text-cyan-400">"{achievement.title}"</span>.</p>
                <p className="text-sm text-gray-400 mb-4">Please provide a reason for the student.</p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows="4"
                    className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500"
                    placeholder="e.g., The uploaded certificate is blurry, please re-upload."
                ></textarea>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition">
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Approval Page Component ---
const FacultyApproval = () => {
    const { selectedClass } = useOutletContext();
    const [pending, setPending] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(null);
    const [showRejectionModalFor, setShowRejectionModalFor] = useState(null);
    const user = auth.currentUser;

    useEffect(() => {
        if (!selectedClass.department || !selectedClass.year || !selectedClass.section) {
            setIsLoading(false);
            setPending([]);
            return;
        }

        const q = query(
            collection(db, "achievements"),
            where("status", "==", "pending"),
            where("department", "==", selectedClass.department),
            where("year", "==", selectedClass.year),
            where("section", "==", selectedClass.section)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const pendingAchievements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            pendingAchievements.sort((a, b) => (a.submittedAt?.toDate() || 0) - (b.submittedAt?.toDate() || 0));
            setPending(pendingAchievements);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching achievements:", error);
            if (error.code === 'failed-precondition') {
                alert("This query requires a database index. Please check the browser console for a link to create it in Firebase.");
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [selectedClass]);

    useEffect(() => {
        if (pending.length > 0) {
            window.anime({ targets: '.pending-card', translateY: [20, 0], opacity: [0, 1], delay: window.anime.stagger(100), easing: 'easeOutExpo' });
        }
    }, [pending]);
    
    // --- New Function for AI Skill Extraction ---
    const extractAndSaveSkills = async (achievement) => {
        const textToAnalyze = `Title: ${achievement.title}. Description: ${achievement.description}`;
        const prompt = `From the following text, extract a list of 3-5 key skills. Return the skills as a JSON array of strings. For example: ["React", "Project Management", "Public Speaking"]. Text: "${textToAnalyze}"`;
        
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        // --- OPTIMIZATION: Switched to the faster gemini-2.5-flash-preview-05-20 model ---
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            
            const result = await response.json();
            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            // Clean and parse the JSON response from the AI
            const jsonText = rawText.match(/\[.*\]/s)[0];
            const skills = JSON.parse(jsonText);

            if (skills && skills.length > 0) {
                const studentUserRef = doc(db, "users", achievement.studentId);
                // Use arrayUnion to add skills without creating duplicates
                await updateDoc(studentUserRef, {
                    skillSet: arrayUnion(...skills)
                });
            }
        } catch (error) {
            console.error("Failed to extract or save skills:", error);
            // We don't block the main approval flow, just log the error.
        }
    };

    const handleApprove = async (achievement) => {
        setIsUpdating(achievement.id);
        try {
            // Step 1: Update the achievement status
            const achievementRef = doc(db, "achievements", achievement.id);
            const blockchainHash = sha256(`${achievement.id}-${Date.now()}`);
            await updateDoc(achievementRef, {
                status: 'verified',
                blockchainHash: blockchainHash,
                verifiedBy: user.uid,
                verifiedAt: new Date(),
            });

            // Step 2 (New): Trigger the AI skill extraction in the background
            await extractAndSaveSkills(achievement);

        } catch (error) {
            console.error("Error approving achievement:", error);
            alert("Failed to approve. Please try again.");
        } finally {
            setIsUpdating(null);
        }
    };
    
    const handleReject = async (reason) => {
        const id = showRejectionModalFor.id;
        setIsUpdating(id);
        try {
            const achievementRef = doc(db, "achievements", id);
            await updateDoc(achievementRef, { status: 'rejected', rejectionReason: reason });
        } catch (error) {
            console.error("Error rejecting achievement:", error);
            alert("Failed to reject. Please try again.");
        } finally {
            setIsUpdating(null);
            setShowRejectionModalFor(null);
        }
    };

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Approval Queue</h1>
            <p className="text-indigo-400 mb-8">
                Reviewing for: {selectedClass.department} - {selectedClass.year} - Section {selectedClass.section}
            </p>

            <main>
                {isLoading && <Spinner />}
                {!isLoading && pending.length === 0 && (
                    <div className="text-center py-10 bg-gray-800/50 backdrop-blur-sm rounded-lg">
                        <p className="text-gray-400">The verification queue for this class is empty.</p>
                    </div>
                )}
                <div className="space-y-6">
                    {pending.map(ach => (
                        <div key={ach.id} className="pending-card bg-gray-800/50 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-cyan-400 mb-2">{ach.title}</h3>
                                    <div className="text-sm text-gray-400 mb-4 space-y-1">
                                        <p><span className='font-semibold'>Student:</span> {ach.studentName}</p>
                                        <p><span className='font-semibold'>Date:</span> {new Date(ach.date).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">{ach.description}</p>
                                </div>
                                <div className="w-full md:w-64 flex-shrink-0">
                                    <p className="font-semibold text-gray-300 mb-2">Certificate/Proof:</p>
                                    <a href={ach.imageUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={ach.imageUrl} alt="Certificate" className="rounded-lg w-full h-auto object-cover cursor-pointer hover:opacity-80 transition" />
                                    </a>
                                    <div className="flex gap-4 mt-4">
                                        <button onClick={() => handleApprove(ach)} disabled={isUpdating === ach.id} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-green-800">
                                            {isUpdating === ach.id ? '...' : 'Approve'}
                                        </button>
                                        <button onClick={() => setShowRejectionModalFor(ach)} disabled={isUpdating === ach.id} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-red-800">
                                            {isUpdating === ach.id ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {showRejectionModalFor && (
                <RejectionModal 
                    achievement={showRejectionModalFor} 
                    onConfirm={handleReject} 
                    onCancel={() => setShowRejectionModalFor(null)} 
                />
            )}
        </div>
    );
};

export default FacultyApproval;

