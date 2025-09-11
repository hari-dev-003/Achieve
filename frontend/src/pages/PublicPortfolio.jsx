import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseconfig';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import Spinner from '../components/Spinner';

// --- Reusable UI Component for Verified Achievements ---
const VerifiedAchievementCard = ({ achievement }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyHash = () => {
        navigator.clipboard.writeText(achievement.blockchainHash);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full animate-fade-in-up">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-cyan-400">{achievement.title}</h3>
                <span className="text-xs font-semibold bg-green-500/20 text-green-300 px-3 py-1 rounded-full">VERIFIED</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
                {achievement.date ? new Date(achievement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No Date'}
            </p>
            <p className="text-gray-300 mb-6 leading-relaxed">{achievement.description}</p>

            <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-2">Blockchain Verification Hash (SHA-256)</p>
                <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg">
                    <p className="text-xs text-gray-400 truncate flex-grow">{achievement.blockchainHash}</p>
                    <button onClick={handleCopyHash} className="text-xs bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-md transition">
                        {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Public Portfolio Component ---
const PublicPortfolio = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [studentName, setStudentName] = useState('');
    const [achievements, setAchievements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!studentId) {
            setError("No student ID provided.");
            setIsLoading(false);
            return;
        }

        const fetchStudentInfo = async () => {
            try {
                const userQuery = query(collection(db, "users"), where("uid", "==", studentId));
                const querySnapshot = await getDocs(userQuery);
                if (!querySnapshot.empty) {
                    const studentData = querySnapshot.docs[0].data();
                    setStudentName(studentData.name || "Student");
                } else {
                    setError("Student profile not found.");
                    setStudentName("Unknown Student");
                }
            } catch (err) {
                console.error("Error fetching student name:", err);
                setError("Could not fetch student details.");
                setStudentName("Unknown Student");
            }
        };

        fetchStudentInfo();

        const achievementsQuery = query(
            collection(db, "achievements"),
            where("studentId", "==", studentId),
            where("status", "==", "verified"),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(achievementsQuery, (querySnapshot) => {
            const verifiedAchievements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAchievements(verifiedAchievements);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching portfolio:", err);
            setError("Could not load the portfolio achievements.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [studentId]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 text-center">
                    {isLoading ? (
                        <div className="h-12 w-3/4 bg-gray-700 rounded-md animate-pulse mx-auto"></div>
                    ) : (
                        <h1 className="text-4xl md:text-5xl font-bold text-white">{studentName}'s Portfolio</h1>
                    )}
                    <p className="text-sm text-gray-400 mt-2 break-all">UserID: {studentId}</p>
                </header>

                <main className="space-y-6">
                    {isLoading && <Spinner />}
                    
                    {error && !isLoading && <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p>}

                    {!isLoading && !error && (
                        achievements.length > 0 ? (
                            achievements.map(ach => <VerifiedAchievementCard key={ach.id} achievement={ach} />)
                        ) : (
                            <div className="text-center py-10 bg-gray-800 rounded-lg">
                                <p className="text-gray-400">No verified achievements found for this student.</p>
                            </div>
                        )
                    )}
                </main>

                <footer className="text-center mt-12">
                     <button onClick={() => navigate('/login')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition">
                        &larr; Back to Login
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PublicPortfolio;

