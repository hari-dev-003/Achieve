import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

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


const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('student');
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const timeline = window.anime.timeline({ easing: 'easeOutExpo' });
        timeline.add({
            targets: '.register-header',
            translateY: [-30, 0],
            opacity: [0, 1],
            duration: 800,
            delay: window.anime.stagger(100)
        }).add({
            targets: '.register-card',
            translateY: [30, 0],
            opacity: [0, 1],
            duration: 800,
        }, '-=600');
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        if ((role === 'student' || role === 'faculty') && (!name.trim() || !department || !year || !section)) {
            toast.error('Please fill in all your details.');
            return;
        }
        if (!email || !password) {
            toast.error('Please provide a valid email and password.');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Creating your account...');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userProfile = {
                uid: user.uid,
                email: user.email,
                role: role,
                name: name.trim(),
                department,
                year,
                section,
                createdAt: new Date(),
            };

            await setDoc(doc(db, "users", user.uid), userProfile);
            toast.success('Account created successfully!', { id: toastId });
            navigate(role === 'student' ? '/student-dashboard' : '/faculty-dashboard');
        } catch (error) {
            setIsLoading(false);
            toast.error(error.message, { id: toastId });
            console.error("Registration Error: ", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 overflow-hidden">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="register-header text-4xl md:text-5xl font-bold text-white mb-3 opacity-0">Create an Account</h1>
                    <p className="register-header text-md text-cyan-400 opacity-0">Join the Smart Student Hub</p>
                </div>
                <div className="register-card bg-gray-800 p-8 rounded-2xl shadow-2xl opacity-0">
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">I am a...</label>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2 rounded-lg transition ${role === 'student' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Student</button>
                                <button type="button" onClick={() => setRole('faculty')} className={`flex-1 py-2 rounded-lg transition ${role === 'faculty' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Faculty</button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CustomSelect id="department" value={department} onChange={(e) => setDepartment(e.target.value)} options={departments} placeholder="Select Department" />
                            <CustomSelect id="year" value={year} onChange={(e) => setYear(e.target.value)} options={years} placeholder="Select Year" />
                        </div>
                        <CustomSelect id="class" value={section} onChange={(e) => setSection(e.target.value)} options={classes} placeholder="Select Class" />
                        
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500" />
                        </div>

                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        
                        <button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 disabled:bg-green-800 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoading ? <Spinner /> : 'Create Account'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-gray-400 mt-6">
                        Already have an account? <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

