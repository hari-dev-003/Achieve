import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { auth, db } from './firebaseconfig';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Component/Page imports (we will create these in the next steps)
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import PublicPortfolio from './pages/PublicPortfolio';
import Spinner from './components/Spinner';

// A custom component to protect routes based on user role
function ProtectedRoute({ user, role, requiredRole, children }) {
  if (!user) {
    // If no user, redirect to login
    return <Navigate to="/login" replace />;
  }
  if (role !== requiredRole) {
    // If user has the wrong role, redirect them to their own dashboard or login
    const userDashboard = role === 'student' ? '/student/dashboard' : '/faculty/dashboard';
    return <Navigate to={userDashboard} replace />;
  }
  // If user exists and has the correct role, render the child component
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUser(currentUser);
          setUserRole(userData.role);
          // Redirect from login page if user is already logged in
          if (location.pathname === '/login') {
            navigate(userData.role === 'student' ? '/student/dashboard' : '/faculty/dashboard');
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const handleLogin = async (role) => {
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const currentUser = userCredential.user;
      
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        role: role,
        createdAt: new Date()
      });

      setUser(currentUser);
      setUserRole(role);

      // Navigate to the correct dashboard after login
      const destination = role === 'student' ? '/student/dashboard' : '/faculty/dashboard';
      navigate(destination);

    } catch (error) {
      console.error("Authentication Error:", error);
      alert("An error occurred during sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Routes>
        <Route path="/login" element={<LoginPage handleLogin={handleLogin} />} />

        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute user={user} role={userRole} requiredRole="student">
              <StudentDashboard user={user} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/faculty/dashboard" 
          element={
            <ProtectedRoute user={user} role={userRole} requiredRole="faculty">
              <FacultyDashboard user={user} />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/portfolio/:studentId" element={<PublicPortfolio />} />

        {/* Redirect logic for the root path */}
        <Route path="/" element={
          user 
            ? <Navigate to={userRole === 'student' ? '/student/dashboard' : '/faculty/dashboard'} replace /> 
            : <Navigate to="/login" replace />
        } />

        {/* Catch-all route for any other path */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

