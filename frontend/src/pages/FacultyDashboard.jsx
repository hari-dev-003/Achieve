import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseconfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { sha256 } from 'js-sha256';
import Spinner from '../components/Spinner';

// --- Data for dropdowns ---
const departments = ["CSE", "IT", "CSBS", "AIDS", "ECE", "EEE", "Civil", "Mechanical", "Chemical", "Instrumentation"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const classes = ["A", "B", "C"];

// --- Custom Select Component for consistent styling ---
const CustomSelect = ({ id, value, onChange, options, placeholder, className }) => (
    <div className={`relative ${className}`}>
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white appearance-none focus:ring-2 focus:ring-indigo-500"
        >
            <option value="">{placeholder}</option>
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.144-.446 1.58 0L10 10.404l2.904-2.856c.436-.446 1.144-.446 1.58 0 .436.446.436 1.167 0 1.613l-3.72 3.655c-.436.446-1.144.446-1.58 0L5.516 9.16c-.436-.446-.436-1.167 0-1.613z"/></svg>
        </div>
    </div>
);


// --- Rejection Feedback Modal Component ---
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


// --- Main Faculty Dashboard Component ---
const FacultyDashboard = ({ user }) => {
    const [pending, setPending] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(null);
    const [showRejectionModalFor, setShowRejectionModalFor] = useState(null);
    
    // State for filters
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterSection, setFilterSection] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        window.anime({ targets: '.dashboard-header, .dashboard-content', translateY: [-20, 0], opacity: [0, 1], duration: 800, delay: window.anime.stagger(100, {start: 300}), easing: 'easeOutExpo' });
    }, []);
    
    useEffect(() => {
        // Base query for pending achievements
        let q = query(collection(db, "achievements"), where("status", "==", "pending"));

        // Dynamically add filters to the query
        if (filterDepartment) {
            q = query(q, where("department", "==", filterDepartment));
        }
        if (filterYear) {
            q = query(q, where("year", "==", filterYear));
        }
        if (filterSection) {
            q = query(q, where("section", "==", filterSection));
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const pendingAchievements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            pendingAchievements.sort((a, b) => (a.submittedAt?.toDate() || 0) - (b.submittedAt?.toDate() || 0));
            setPending(pendingAchievements);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching achievements:", error);
            // This error can happen if an index is required. Firestore provides a link to create it.
            if (error.code === 'failed-precondition') {
                alert("This filter combination requires a new database index. Please check the browser console for a link to create it in Firebase.");
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [filterDepartment, filterYear, filterSection]); // Re-run query when filters change

    useEffect(() => {
        if (pending.length > 0) {
            window.anime({ targets: '.pending-card', translateY: [20, 0], opacity: [0, 1], delay: window.anime.stagger(100), easing: 'easeOutExpo' });
        }
    }, [pending]);
    
    const handleClearFilters = () => {
        setFilterDepartment('');
        setFilterYear('');
        setFilterSection('');
    };

    const handleApprove = async (id) => {
        setIsUpdating(id);
        try {
            const achievementRef = doc(db, "achievements", id);
            const blockchainHash = sha256(`${id}-${Date.now()}`);
            await updateDoc(achievementRef, {
                status: 'verified',
                blockchainHash: blockchainHash,
                verifiedBy: user.uid, 
                verifiedAt: new Date(),
            });
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

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="dashboard-header flex flex-col md:flex-row justify-between items-center mb-8 gap-4 opacity-0">
                <div>
                    <h1 className="text-3xl font-bold text-white">Faculty Dashboard</h1>
                    <p className="text-indigo-400">Verification Portal</p>
                </div>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition self-end md:self-auto">
                    Logout
                </button>
            </header>

            <main className="dashboard-content opacity-0">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Filter Submissions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <CustomSelect id="department" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} options={departments} placeholder="All Departments" />
                        <CustomSelect id="year" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} options={years} placeholder="All Years" />
                        <CustomSelect id="class" value={filterSection} onChange={(e) => setFilterSection(e.target.value)} options={classes} placeholder="All Classes" />
                        <button onClick={handleClearFilters} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2.5 px-4 rounded-lg transition h-full">Clear Filters</button>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold mb-4 text-white">Pending Submissions ({pending.length})</h2>
                {isLoading && <Spinner />}
                {!isLoading && pending.length === 0 && (
                     <div className="text-center py-10 bg-gray-800/50 backdrop-blur-sm rounded-lg">
                        <p className="text-gray-400">No pending submissions match the current filters.</p>
                    </div>
                )}
                <div className="space-y-6">
                    {pending.map(ach => (
                        <div key={ach.id} className="pending-card bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Column 1: Details */}
                                <div className="md:col-span-2">
                                    <h3 className="text-xl font-bold text-cyan-400 mb-2">{ach.title}</h3>
                                    <div className="text-sm text-gray-400 mb-4 space-y-1">
                                        <p><span className='font-semibold'>Student:</span> {ach.studentName}</p>
                                        <p><span className='font-semibold'>Class:</span> {ach.department} - {ach.year} - Section {ach.section}</p>
                                        <p><span className='font-semibold'>Date:</span> {new Date(ach.date).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">{ach.description}</p>
                                </div>
                                {/* Column 2: Certificate & Actions */}
                                <div>
                                    <p className="font-semibold text-gray-300 mb-2">Certificate/Proof:</p>
                                    <a href={ach.imageUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={ach.imageUrl} alt="Certificate" className="rounded-lg w-full h-auto object-cover cursor-pointer hover:opacity-80 transition" />
                                    </a>
                                    <div className="flex gap-4 mt-4">
                                        <button onClick={() => handleApprove(ach.id)} disabled={isUpdating === ach.id} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-green-800">
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

export default FacultyDashboard;

