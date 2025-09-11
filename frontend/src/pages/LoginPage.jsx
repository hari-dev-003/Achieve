import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        // Entrance Animation using the global anime function
        const timeline = window.anime.timeline({
            easing: 'easeOutExpo',
        });

        timeline.add({
            targets: '.login-header',
            translateY: [-30, 0],
            opacity: [0, 1],
            duration: 800,
            delay: window.anime.stagger(100)
        }).add({
            targets: '.login-card',
            translateY: [30, 0],
            opacity: [0, 1],
            duration: 800,
        }, '-=600'); // Start this animation 600ms before the previous one ends
    }, []);


    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please enter both email and password.');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Signing in...');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                toast.success('Logged in successfully!', { id: toastId });
                if (userData.role === 'student') {
                    navigate('/student-dashboard');
                } else if (userData.role === 'faculty') {
                    navigate('/faculty-dashboard');
                } else {
                    navigate('/'); 
                }
            } else {
                throw new Error("User role not found.");
            }
        } catch (error) {
            setIsLoading(false);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast.error('Account not found. Please check your email and password.', { id: toastId });
            } else {
                toast.error(error.message, { id: toastId });
            }
            console.error("Login Error: ", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 overflow-hidden">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="login-header text-4xl md:text-5xl font-bold text-white mb-3 opacity-0">Welcome Back</h1>
                    <p className="login-header text-md text-cyan-400 opacity-0">Student & Faculty Login for the Smart Student Hub</p>
                </div>
                <div className="login-card bg-gray-800 p-8 rounded-2xl shadow-2xl opacity-0">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500" />
                        </div>

                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        
                        <button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 disabled:bg-cyan-800 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoading ? <Spinner /> : 'Log In'}
                        </button>
                    </form>
                    
                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-500 text-sm">New here?</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>
                    
                    <Link to="/register">
                        <button className="w-full bg-transparent border border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white font-bold py-3 px-4 rounded-lg transition">
                           Create an Account
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

