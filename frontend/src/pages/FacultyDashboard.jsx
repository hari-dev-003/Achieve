import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseconfig';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { sha256 } from 'js-sha256';
import Spinner from '../components/Spinner';

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
    const [isUpdating, setIsUpdating] = useState(null); // Tracks ID of item being updated
    const [showRejectionModalFor, setShowRejectionModalFor] = useState(null); // Holds achievement for modal
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(
            collection(db, "achievements"), 
            where("status", "==", "pending"),
            orderBy("submittedAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const pendingAchievements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPending(pendingAchievements);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching pending achievements:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (id) => {
        setIsUpdating(id);
        try {
            const achievementRef = doc(db, "achievements", id);
            const blockchainHash = sha256(`${id}-${Date.now()}`);
            await updateDoc(achievementRef, {
                status: 'verified',
                blockchainHash: blockchainHash,
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
            await updateDoc(achievementRef, {
                status: 'rejected',
                rejectionReason: reason, // Add the reason to the document
            });
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
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Faculty Dashboard</h1>
                    <p className="text-indigo-400">Verification Portal</p>
                </div>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition self-end md:self-auto">
                    Logout
                </button>
            </header>

            <main>
                <h2 className="text-2xl font-semibold mb-4 text-white">Pending Submissions</h2>
                {isLoading && <Spinner />}
                {!isLoading && pending.length === 0 && (
                     <div className="text-center py-10 bg-gray-800 rounded-lg">
                        <p className="text-gray-400">The verification queue is empty.</p>
                        <p className="text-gray-500 text-sm mt-2">Great job!</p>
                    </div>
                )}
                <div className="space-y-6">
                    {pending.map(ach => (
                        <div key={ach.id} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Column 1: Details */}
                                <div className="md:col-span-2">
                                    <h3 className="text-xl font-bold text-cyan-400 mb-2">{ach.title}</h3>
                                    <p className="text-sm text-gray-400 mb-1"><span className='font-semibold'>Student ID:</span> {ach.studentId}</p>
                                    <p className="text-sm text-gray-400 mb-4"><span className='font-semibold'>Date:</span> {new Date(ach.date).toLocaleDateString()}</p>
                                    <p className="text-gray-300 leading-relaxed">{ach.description}</p>
                                </div>

                                {/* Column 2: Certificate & Actions */}
                                <div>
                                    <p className="font-semibold text-gray-300 mb-2">Certificate/Proof:</p>
                                    <a href={ach.imageUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={ach.imageUrl} alt="Certificate" className="rounded-lg w-full h-auto object-cover cursor-pointer hover:opacity-80 transition" />
                                    </a>
                                    <div className="flex gap-4 mt-4">
                                        <button 
                                            onClick={() => handleApprove(ach.id)} 
                                            disabled={isUpdating === ach.id}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-green-800"
                                        >
                                            {isUpdating === ach.id ? '...' : 'Approve'}
                                        </button>
                                        <button 
                                            onClick={() => setShowRejectionModalFor(ach)}
                                            disabled={isUpdating === ach.id}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-red-800"
                                        >
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

