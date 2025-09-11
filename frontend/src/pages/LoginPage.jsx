import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import Spinner from '../components/Spinner';

const LoginPage = () => {
    const [studentName, setStudentName] = useState('');
    const [isLoading, setIsLoading] = useState({ student: false, faculty: false });
    const navigate = useNavigate();
    const auth = getAuth();
    const db = getFirestore();

    const handleLogin = async (role) => {
        if (role === 'student' && !studentName.trim()) {
            alert('Please enter your name to create a student profile.');
            return;
        }

        setIsLoading(prev => ({ ...prev, [role]: true }));

        try {
            const userCredential = await signInAnonymously(auth);
            const user = userCredential.user;

            const userProfile = {
                uid: user.uid,
                role: role,
                createdAt: new Date(),
            };

            if (role === 'student') {
                userProfile.name = studentName.trim();
            }

            await setDoc(doc(db, "users", user.uid), userProfile);
            
            navigate(role === 'student' ? '/student-dashboard' : '/faculty-dashboard');

        } catch (error) {
            console.error("Error signing in: ", error);
            alert("Login failed. Please try again.");
            setIsLoading(prev => ({ ...prev, [role]: false }));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="text-center mb-8">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in-up">Smart Student Hub</h1>
                <p className="text-lg md:text-xl text-cyan-400 animate-fade-in-up" style={{ animationDelay: '200ms' }}>Your Verified Journey to Success.</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <h2 className="text-2xl font-semibold text-center text-white mb-6">Join as</h2>
                <div className="flex flex-col space-y-4">
                    {/* Student Login */}
                    <div className="space-y-3">
                         <label htmlFor="studentName" className="block text-sm font-medium text-gray-300">Student Name</label>
                        <input
                            id="studentName"
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500"
                        />
                        <button 
                            onClick={() => handleLogin('student')} 
                            disabled={isLoading.student}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 disabled:bg-cyan-800 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading.student ? <Spinner /> : 'Login as Student'}
                        </button>
                    </div>

                    <div className="relative flex py-3 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-500">OR</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>

                    {/* Faculty Login */}
                    <button 
                        onClick={() => handleLogin('faculty')} 
                        disabled={isLoading.faculty}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 disabled:bg-indigo-800 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading.faculty ? <Spinner /> : 'Login as Faculty'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

