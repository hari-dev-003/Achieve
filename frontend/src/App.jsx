import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Toaster } from 'react-hot-toast';

// Import Page Components from their new locations
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicPortfolio from './pages/PublicPortfolio';
import Spinner from './components/Spinner';

// Import student-specific pages
import StudentDashboard from './pages/Student/StudentDashboard';

// Import the new Faculty Layout and its nested pages
import FacultyLayout from './pages/Faculty/FacultyLayout';
import FacultyProfile from './pages/Faculty/FacultyProfile';
import FacultyApproval from './pages/Faculty/FacultyApproval';
import FacultyClassView from './pages/Faculty/FacultyClassView';


// --- Protected Route Component ---
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
                toastOptions={{ style: { background: '#333', color: '#fff' } }}
            />
            
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
                    <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
                    <Route path="/portfolio/:studentId" element={<PublicPortfolio />} />

                    {/* Protected Student Route */}
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

                    {/* Protected Faculty Routes with Nested Layout */}
                    <Route 
                        path="/faculty-dashboard"
                        element={
                            <ProtectedRoute
                                user={user}
                                userRole={userRole}
                                requiredRole="faculty"
                                isLoading={isLoading}
                                component={FacultyLayout}
                            />
                        }
                    >
                        <Route index element={<Navigate to="profile" replace />} />
                        <Route path="profile" element={<FacultyProfile />} />
                        <Route path="approval" element={<FacultyApproval />} />
                        <Route path="class-view" element={<FacultyClassView />} /> 
                    </Route>


                    {/* Root path redirect logic */}
                    <Route 
                        path="/" 
                        element={
                            isLoading ? <div className="flex items-center justify-center h-screen bg-gray-900"><Spinner /></div> : 
                            !user ? <Navigate to="/login" /> :
                            userRole === 'student' ? <Navigate to="/student-dashboard" /> :
                            userRole === 'faculty' ? <Navigate to="/faculty-dashboard" /> :
                            <Navigate to="/login" />
                        } 
                    />
                </Routes>
            
        </>
    );
};

export default App;

