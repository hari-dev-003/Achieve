import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseconfig';
import { collection, query, where, onSnapshot, addDoc, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Spinner from '../components/Spinner';

// --- Reusable UI Components ---

const StatusBadge = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-bold rounded-full transition-colors duration-300 backdrop-blur-sm";
    let colorClasses = "";
    switch (status) {
        case 'verified':
            colorClasses = "bg-green-500/30 text-green-300";
            break;
        case 'pending':
            colorClasses = "bg-yellow-500/30 text-yellow-300";
            break;
        case 'rejected':
            colorClasses = "bg-red-500/30 text-red-300";
            break;
        default:
            colorClasses = "bg-gray-500/30 text-gray-300";
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status.toUpperCase()}</span>;
};

const AchievementCard = ({ achievement, onEdit, onDelete }) => (
    <div className="achievement-card bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex flex-col justify-between hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden opacity-0">
        <div className="relative h-40 bg-gray-700">
            <img src={achievement.imageUrl} alt={achievement.title} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/1F2937/7DD3FC?text=Image+Not+Found'; }}/>
            <div className="absolute top-2 right-2">
                 <StatusBadge status={achievement.status} />
            </div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <div>
                <h3 className="text-lg font-bold text-white pr-2 truncate">{achievement.title}</h3>
                <p className="text-sm text-gray-400 mb-3">
                    {achievement.date ? new Date(achievement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No Date'}
                </p>
                {achievement.status === 'rejected' && achievement.rejectionReason && (
                    <div className="bg-red-500/10 p-3 rounded-lg mb-3">
                        <p className="text-sm font-semibold text-red-300">Rejection Reason:</p>
                        <p className="text-sm text-red-400 leading-tight">{achievement.rejectionReason}</p>
                    </div>
                )}
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">{achievement.description}</p>
            </div>
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-700/50">
                 <a 
                    href={achievement.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
                >
                    View Full &rarr;
                </a>
                {(achievement.status === 'pending' || achievement.status === 'rejected') && (
                    <div className="flex gap-3">
                        <button onClick={() => onEdit(achievement)} className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold">Edit</button>
                        <button onClick={() => onDelete(achievement)} className="text-xs text-red-400 hover:text-red-300 font-semibold">Delete</button>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const AddAchievementForm = ({ user, onFormClose, achievementToEdit }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    const isEditMode = !!achievementToEdit;

    useEffect(() => {
        // Animate form entrance
        window.anime({
            targets: formRef.current,
            translateY: [-30, 0],
            opacity: [0, 1],
            duration: 600,
            easing: 'easeOutExpo'
        });
    }, []);

    useEffect(() => {
        if (isEditMode) {
            setTitle(achievementToEdit.title);
            setDate(achievementToEdit.date);
            setDescription(achievementToEdit.description);
            setImagePreview(achievementToEdit.imageUrl);
        }
    }, [achievementToEdit, isEditMode]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            if (isEditMode) setImagePreview(achievementToEdit.imageUrl);
            else setImagePreview('');
            if (file) alert("Please select a valid image file.");
        }
    };

    const fileToGenerativePart = async (file) => {
        const base64EncodedDataPromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
    };

    const handleGenerateDescription = async () => {
        if (!title || !imageFile) {
            alert("Please provide a title and upload an image before using AI.");
            return;
        }
        setIsGenerating(true);
        setDescription("Analyzing certificate and generating with AI...");

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        try {
            const imagePart = await fileToGenerativePart(imageFile);
            const prompt = `Analyze the certificate image for an achievement titled "${title}". Based *only* on the image, write a professional, concise (2-3 sentences) description for a student's portfolio. Highlight the skills gained.`;
            
            const payload = { contents: [{ parts: [{ text: prompt }, imagePart] }] };
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            
            const result = await response.json();
            const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            setDescription(generatedText ? generatedText.trim() : "AI failed to generate. Please write manually.");
        } catch (error) {
            console.error("AI Generation Error:", error);
            setDescription(`Error: ${error.message}. Please describe manually.`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !date || !description) {
            alert("Please fill all fields.");
            return;
        }
        if (!isEditMode && !imageFile) {
            alert("Please upload a certificate image.");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = achievementToEdit?.imageUrl;
            if (imageFile) { 
                const formData = new FormData();
                formData.append('file', imageFile);
                formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
                const uploadResponse = await fetch(cloudinaryUrl, { method: 'POST', body: formData });
                if (!uploadResponse.ok) throw new Error('Image upload failed.');
                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.secure_url;
            }
            
            const achievementData = {
                studentId: user.uid,
                title,
                date,
                description,
                imageUrl,
                status: 'pending', 
                blockchainHash: null,
                submittedAt: isEditMode && achievementToEdit.submittedAt ? achievementToEdit.submittedAt.toDate() : new Date(),
                lastUpdatedAt: new Date()
            };

            if (isEditMode) {
                await updateDoc(doc(db, "achievements", achievementToEdit.id), achievementData);
            } else {
                await addDoc(collection(db, "achievements"), achievementData);
            }
            onFormClose();
        } catch (error) {
            console.error("Submission Error:", error);
            alert(`Failed to submit: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div ref={formRef} className="bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-700 mb-8 max-w-3xl mx-auto opacity-0">
            <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-2xl font-bold text-white">{isEditMode ? 'Edit Achievement' : 'Log a New Achievement'}</h3>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Achievement Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500" required />
                </div>
                <div>
                    <label htmlFor="certificate" className="block text-sm font-medium text-gray-300 mb-2">Certificate/Proof (Image)</label>
                    <input type="file" id="certificate" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-cyan-400 hover:file:bg-gray-600" />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 rounded-lg max-h-40" />}
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500" required />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating || !title || !imageFile} className="mb-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isGenerating ? 'Analyzing...' : 'Generate with AI ✨'}
                    </button>
                    <textarea id="description" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500" placeholder="A description will be generated here, or you can write your own." required></textarea>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onFormClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:bg-cyan-800 disabled:cursor-wait">
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const DeleteConfirmationModal = ({ achievement, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md animate-fade-in-up">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Deletion</h2>
            <p className="text-sm text-gray-400 mb-4">Are you sure you want to permanently delete: <span className="font-semibold text-cyan-400">"{achievement.title}"</span>?</p>
            <div className="flex justify-end gap-4 mt-6">
                <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition">Cancel</button>
                <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition">Yes, Delete</button>
            </div>
        </div>
    </div>
);

// --- Main Student Dashboard Component ---
const StudentDashboard = ({ user }) => {
    const [achievements, setAchievements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [achievementToEdit, setAchievementToEdit] = useState(null);
    const [achievementToDelete, setAchievementToDelete] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Page Entrance Animation
        window.anime({
            targets: '.dashboard-header, .dashboard-content',
            translateY: [-20, 0],
            opacity: [0, 1],
            duration: 800,
            delay: window.anime.stagger(100, {start: 300}),
            easing: 'easeOutExpo'
        });
    }, []);

    useEffect(() => {
        if (!user) { setIsLoading(false); return; }
        const q = query(collection(db, "achievements"), where("studentId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userAchievements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            userAchievements.sort((a, b) => (b.submittedAt?.toDate() || 0) - (a.submittedAt?.toDate() || 0));
            setAchievements(userAchievements);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching achievements:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        // Stagger animation for achievement cards
        if (achievements.length > 0) {
            window.anime({
                targets: '.achievement-card',
                translateY: [20, 0],
                opacity: [0, 1],
                delay: window.anime.stagger(100),
                easing: 'easeOutExpo'
            });
        }
    }, [achievements]);

    const handleEdit = (achievement) => {
        setAchievementToEdit(achievement);
        setShowForm(true);
    };
    
    const handleDelete = async () => {
        if (!achievementToDelete) return;
        try {
            await deleteDoc(doc(db, "achievements", achievementToDelete.id));
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Failed to delete achievement.");
        } finally {
            setAchievementToDelete(null);
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setAchievementToEdit(null);
    };

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="dashboard-header flex flex-col md:flex-row justify-between items-center mb-8 gap-4 opacity-0">
                <div>
                    <h1 className="text-3xl font-bold text-white">Student Dashboard</h1>
                    <p className="text-cyan-400 text-xs md:text-sm break-all">UserID: {user?.uid}</p>
                </div>
                <div className='flex items-center gap-2'>
                    <button onClick={() => navigate(`/portfolio/${user.uid}`)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">View My Portfolio</button>
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">Logout</button>
                </div>
            </header>
            
            <div className="dashboard-content text-center mb-8 opacity-0">
                <button onClick={() => { setShowForm(true); setAchievementToEdit(null); }} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-lg">
                    ＋ Add New Achievement
                </button>
            </div>

            {showForm && <AddAchievementForm user={user} onFormClose={handleFormClose} achievementToEdit={achievementToEdit} />}
            
            <div className="dashboard-content mt-8 opacity-0">
                <h2 className="text-2xl font-semibold mb-4 text-white">My Submissions</h2>
                {isLoading ? <Spinner /> : (
                    achievements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {achievements.map(ach => <AchievementCard key={ach.id} achievement={ach} onEdit={handleEdit} onDelete={() => setAchievementToDelete(ach)} />)}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-800 rounded-lg">
                            <p className="text-gray-400">You haven't added any achievements yet.</p>
                            <p className="text-gray-500 text-sm mt-2">Click the button above to get started!</p>
                        </div>
                    )
                )}
            </div>

            {achievementToDelete && (
                <DeleteConfirmationModal
                    achievement={achievementToDelete}
                    onConfirm={handleDelete}
                    onCancel={() => setAchievementToDelete(null)}
                />
            )}
        </div>
    );
};

export default StudentDashboard;

