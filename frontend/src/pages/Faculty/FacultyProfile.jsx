import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

// --- Data for dropdowns ---
const departments = ["CSE", "IT", "CSBS", "AIDS", "ECE", "EEE", "Civil", "Mechanical", "Chemical", "Instrumentation"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const classes = ["A", "B", "C"];

// --- Custom Select Component for consistent styling ---
const CustomSelect = ({ id, value, onChange, options, placeholder }) => (
    <div className="relative">
        <select
            id={id}
            value={value}
            onChange={onChange}
            required
            className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white appearance-none focus:ring-2 focus:ring-indigo-500"
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.144-.446 1.58 0L10 10.404l2.904-2.856c.436-.446 1.144-.446 1.58 0 .436.446.436 1.167 0 1.613l-3.72 3.655c-.436.446-1.144.446-1.58 0L5.516 9.16c-.436-.446-.436-1.167 0-1.613z"/></svg>
        </div>
    </div>
);

const FacultyProfile = () => {
    // Access shared state from the FacultyLayout using the Outlet's context
    const { facultyDetails, selectedClass, setSelectedClass } = useOutletContext();

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

    if (!facultyDetails) {
        return <p>Loading profile...</p>;
    }

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">Profile & Class Selection</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Details Card */}
                <div className="profile-card bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                    <h2 className="text-xl font-semibold text-cyan-400 mb-4">Your Profile</h2>
                    <div className="space-y-3 text-sm">
                        <p><span className="font-semibold text-gray-400">Name:</span> {facultyDetails.name}</p>
                        <p><span className="font-semibold text-gray-400">Email:</span> {facultyDetails.email}</p>
                        <p className="font-semibold text-gray-400 pt-2">Default Assigned Class:</p>
                        <p className="pl-4">{facultyDetails.department} - {facultyDetails.year} - Section {facultyDetails.section}</p>
                    </div>
                </div>

                {/* Class View Selection Card */}
                <div className="profile-card bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                    <h2 className="text-xl font-semibold text-indigo-400 mb-4">Select Class to View</h2>
                    <p className="text-sm text-gray-400 mb-6">Choose a class to manage their achievement submissions. This selection will apply to the 'Approval Queue' and 'Class Achievements' pages.</p>
                    <div className="space-y-4">
                        <CustomSelect 
                            id="department" 
                            value={selectedClass.department} 
                            onChange={(e) => setSelectedClass({ ...selectedClass, department: e.target.value })} 
                            options={departments} 
                            placeholder="Select Department" 
                        />
                        <CustomSelect 
                            id="year" 
                            value={selectedClass.year} 
                            onChange={(e) => setSelectedClass({ ...selectedClass, year: e.target.value })} 
                            options={years} 
                            placeholder="Select Year" 
                        />
                        <CustomSelect 
                            id="class" 
                            value={selectedClass.section} 
                            onChange={(e) => setSelectedClass({ ...selectedClass, section: e.target.value })} 
                            options={classes} 
                            placeholder="Select Class" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyProfile;
