import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebaseconfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Spinner from '../../components/Spinner';

// --- Status Badge Component (Re-used) ---
const StatusBadge = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-bold rounded-full transition-colors duration-300";
    let colorClasses = "";
    switch (status) {
        case 'verified':
            colorClasses = "bg-green-500/20 text-green-300";
            break;
        case 'pending':
            colorClasses = "bg-yellow-500/20 text-yellow-300";
            break;
        case 'rejected':
            colorClasses = "bg-red-500/20 text-red-300";
            break;
        default:
            colorClasses = "bg-gray-500/20 text-gray-300";
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status.toUpperCase()}</span>;
};

// --- Student Accordion Component ---
const StudentAccordion = ({ student, achievements }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Animate the accordion content when it opens/closes
        const content = document.getElementById(`accordion-content-${student.id}`);
        if (isOpen) {
            window.anime({
                targets: content,
                height: [0, content.scrollHeight],
                opacity: [0, 1],
                duration: 400,
                easing: 'easeOutExpo'
            });
        } else {
             window.anime({
                targets: content,
                height: 0,
                opacity: 0,
                duration: 400,
                easing: 'easeInExpo'
            });
        }
    }, [isOpen, student.id]);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <span className="font-semibold text-white">{student.name}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <div id={`accordion-content-${student.id}`} className="h-0 opacity-0 overflow-hidden">
                <div className="border-t border-gray-700 p-4 space-y-3">
                    {achievements.map(ach => (
                        <div key={ach.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                            <a href={ach.imageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline truncate pr-4">
                                {ach.title}
                            </a>
                            <StatusBadge status={ach.status} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Main Class View Page Component ---
const FacultyClassView = () => {
    const { selectedClass } = useOutletContext();
    const [groupedAchievements, setGroupedAchievements] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!selectedClass.department || !selectedClass.year || !selectedClass.section) {
            setIsLoading(false);
            setGroupedAchievements({});
            return;
        }

        const q = query(
            collection(db, "achievements"),
            where("department", "==", selectedClass.department),
            where("year", "==", selectedClass.year),
            where("section", "==", selectedClass.section)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const achievements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Group achievements by student
            const grouped = achievements.reduce((acc, ach) => {
                const studentId = ach.studentId;
                if (!acc[studentId]) {
                    acc[studentId] = {
                        student: { id: studentId, name: ach.studentName },
                        achievements: []
                    };
                }
                acc[studentId].achievements.push(ach);
                return acc;
            }, {});

            setGroupedAchievements(grouped);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching achievements:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [selectedClass]);
    
    useEffect(() => {
        // Animate accordions entering
         if (Object.keys(groupedAchievements).length > 0) {
            window.anime({ targets: '.student-accordion', translateY: [20, 0], opacity: [0, 1], delay: window.anime.stagger(100), easing: 'easeOutExpo' });
        }
    }, [groupedAchievements]);

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Class Achievements</h1>
            <p className="text-indigo-400 mb-8">
                Viewing all submissions for: {selectedClass.department} - {selectedClass.year} - Section {selectedClass.section}
            </p>

            <main>
                {isLoading && <Spinner />}
                {!isLoading && Object.keys(groupedAchievements).length === 0 && (
                    <div className="text-center py-10 bg-gray-800/50 backdrop-blur-sm rounded-lg">
                        <p className="text-gray-400">No achievements have been submitted by students in this class yet.</p>
                    </div>
                )}
                <div className="space-y-4">
                    {Object.values(groupedAchievements).map(({ student, achievements }) => (
                         <div key={student.id} className="student-accordion opacity-0">
                            <StudentAccordion student={student} achievements={achievements} />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default FacultyClassView;

