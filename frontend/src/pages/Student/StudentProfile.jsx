import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';

// --- Data for dropdowns ---
const departments = ["CSE", "IT", "CSBS", "AIDS", "ECE", "EEE", "Civil", "Mechanical", "Chemical", "Instrumentation"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const classes = ["A", "B", "C"];

// --- Custom Select Component (re-used for consistency) ---
const CustomSelect = ({ id, value, onChange, options, placeholder }) => (
    <div className="relative">
        <select
            id={id}
            value={value}
            onChange={onChange}
            required
            className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white appearance-none focus:ring-2 focus:ring-cyan-500"
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.144-.446 1.58 0L10 10.404l2.904-2.856c.436-.446 1.144-.446 1.58 0 .436.446.436 1.167 0 1.613l-3.72 3.655c-.436.446-1.144.446-1.58 0L5.516 9.16c-.436-.446-.436-1.167 0-1.613z"/></svg>
        </div>
    </div>
);

const StudentProfile = () => {
    // Access shared state from the StudentLayout
    const { studentDetails, setStudentDetails } = useOutletContext();
    
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form state for editing
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        year: '',
        section: ''
    });

    useEffect(() => {
        // Entrance animation for the profile cards
        window.anime({
            targets: '.profile-card',
            translateY: [-20, 0],
            opacity: [0, 1],
            duration: 800,
            delay: window.anime.stagger(100),
            easing: 'easeOutExpo'
        });
    }, []);
    
    // When studentDetails are loaded or edit mode changes, update the form
    useEffect(() => {
        if (studentDetails) {
            setFormData({
                name: studentDetails.name,
                department: studentDetails.department,
                year: studentDetails.year,
                section: studentDetails.section,
            });
        }
    }, [studentDetails, isEditMode]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSaveChanges = async () => {
        if (!formData.name || !formData.department || !formData.year || !formData.section) {
            toast.error("All fields must be filled out.");
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading("Saving changes...");

        try {
            const userRef = doc(db, "users", studentDetails.uid);
            await updateDoc(userRef, {
                name: formData.name,
                department: formData.department,
                year: formData.year,
                section: formData.section,
            });
            // Update the shared state in the layout to reflect changes immediately
            setStudentDetails(prev => ({ ...prev, ...formData }));
            toast.success("Profile updated successfully!", { id: toastId });
            setIsEditMode(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    if (!studentDetails) {
        return <Spinner />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white">My Profile</h1>
                {!isEditMode && (
                    <button onClick={() => setIsEditMode(true)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Details Card */}
                <div className="profile-card lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                    <h2 className="text-xl font-semibold text-cyan-400 mb-6">Your Details</h2>
                    {isEditMode ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                                <input id="name" type="text" value={formData.name} onChange={handleInputChange} className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <CustomSelect id="department" value={formData.department} onChange={handleInputChange} options={departments} placeholder="Select Department" />
                                <CustomSelect id="year" value={formData.year} onChange={handleInputChange} options={years} placeholder="Select Year" />
                            </div>
                            <CustomSelect id="section" value={formData.section} onChange={handleInputChange} options={classes} placeholder="Select Class" />
                            <div className="flex justify-end gap-4 pt-4">
                                <button onClick={() => setIsEditMode(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition">Cancel</button>
                                <button onClick={handleSaveChanges} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:bg-green-800">
                                    {isLoading ? <Spinner /> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 text-sm">
                            <p><span className="font-semibold text-gray-400 w-24 inline-block">Name:</span> {studentDetails.name}</p>
                            <p><span className="font-semibold text-gray-400 w-24 inline-block">Email:</span> {studentDetails.email}</p>
                            <p><span className="font-semibold text-gray-400 w-24 inline-block">Department:</span> {studentDetails.department}</p>
                            <p><span className="font-semibold text-gray-400 w-24 inline-block">Year:</span> {studentDetails.year}</p>
                            <p><span className="font-semibold text-gray-400 w-24 inline-block">Class:</span> Section {studentDetails.section}</p>
                        </div>
                    )}
                </div>

                {/* Skills Card */}
                <div className="profile-card bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                     <h2 className="text-xl font-semibold text-cyan-400 mb-4">My Skills</h2>
                     {studentDetails.skillSet && studentDetails.skillSet.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                             {studentDetails.skillSet.map((skill, index) => (
                                 <span key={index} className="bg-gray-700 text-cyan-300 text-xs font-medium px-3 py-1.5 rounded-full">
                                     {skill}
                                 </span>
                             ))}
                         </div>
                     ) : (
                         <p className="text-sm text-gray-400">No skills yet. Get your achievements verified to build your skill profile!</p>
                     )}
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
