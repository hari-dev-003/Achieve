import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Toaster } from 'react-hot-toast';

// Import Page Components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import PublicPortfolio from './pages/PublicPortfolio';
import Spinner from './components/Spinner';

// --- Protected Route Component ---
// This component now takes a 'component' as a prop to render it.
const ProtectedRoute = ({ user, userRole, requiredRole, isLoading, component: Component }) => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-900"><Spinner /></div>;
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (userRole !== requiredRole) {
        return <Navigate to="/login" replace />;
    }
    // Render the passed component and inject the user prop into it.
    return <Component user={user} />;
};


// --- Main App Component ---
const App = () => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserRole(docSnap.data().role);
                }
                setUser(currentUser);
            } else {
                setUser(null);
                setUserRole(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [auth, db]);

    return (
        <>
            <Toaster 
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: { background: '#333', color: '#fff' },
                }}
            />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
                    <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
                    <Route path="/portfolio/:studentId" element={<PublicPortfolio />} />

                    {/* Protected Routes */}
                    <Route 
                        path="/student-dashboard" 
                        element={
                            <ProtectedRoute 
                                user={user} 
                                userRole={userRole} 
                                requiredRole="student" 
                                isLoading={isLoading}
                                component={StudentDashboard} 
                            />
                        }
                    />

                    <Route 
                        path="/faculty-dashboard" 
                        element={
                             <ProtectedRoute 
                                user={user} 
                                userRole={userRole} 
                                requiredRole="faculty" 
                                isLoading={isLoading}
                                component={FacultyDashboard} 
                            />
                        }
                    />

                    {/* Root path redirect logic */}
                    <Route 
                        path="/" 
                        element={
                            isLoading ? <div className="flex items-center justify-center h-screen bg-gray-900"><Spinner /></div> : 
                            !user ? <Navigate to="/login" /> :
                            userRole === 'student' ? <Navigate to="/student-dashboard" /> :
                            userRole === 'faculty' ? <Navigate to="/faculty-dashboard" /> :
                            <Navigate to="/login" /> // Fallback
                        } 
                    />
                </Routes>
            
        </>
    );
};

export default App;

