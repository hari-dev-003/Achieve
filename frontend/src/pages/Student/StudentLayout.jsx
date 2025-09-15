import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebaseconfig';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';

// --- Sidebar Navigation Link Component ---
const SidebarLink = ({ to, icon, children }) => {
    const location = useLocation();
    const isActive = location.pathname.includes(to);
    return (
        <NavLink
            to={to}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
        >
            {icon}
            {children}
        </NavLink>
    );
};

// --- Main Layout Component ---
const StudentLayout = ({ user }) => {
    const [studentDetails, setStudentDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const fetchStudentDetails = async () => {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setStudentDetails(docSnap.data());
            } else {
                console.error("Student details not found!");
                toast.error("Could not find your profile.");
            }
            setIsLoading(false);
        };
        fetchStudentDetails();
    }, [user]);

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-900"><Spinner /></div>;
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-white">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-gray-800 p-4 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-700">
                <div className="text-center mb-6 md:mb-10">
                    <h2 className="text-xl font-bold text-white truncate">{studentDetails?.name || 'Student'}</h2>
                    <p className="text-xs text-cyan-400 truncate">{studentDetails?.email}</p>
                </div>
                {/* On mobile, nav is horizontal. On desktop, vertical. */}
                <nav className="flex flex-row md:flex-col justify-center md:justify-start flex-wrap md:flex-nowrap gap-2 md:space-y-2">
                    <SidebarLink to="/student-dashboard/profile" icon={<span className="mr-3">👤</span>}>
                        My Profile
                    </SidebarLink>
                    <SidebarLink to="/student-dashboard/achievements" icon={<span className="mr-3">🏆</span>}>
                        My Achievements
                    </SidebarLink>
                    <SidebarLink to="/student-dashboard/recommendations" icon={<span className="mr-3">💡</span>}>
                        Recommendations
                    </SidebarLink>
                    <SidebarLink to="/student-dashboard/pathway" icon={<span className="mr-3">🚀</span>}>
                        Career Pathway
                    </SidebarLink>
                    <SidebarLink to="/student-dashboard/find-teammates" icon={<span className="mr-3">🤝</span>}>
                        Find Teammates
                    </SidebarLink>
                     <SidebarLink to={`/portfolio/${user.uid}`} icon={<span className="mr-3">🌍</span>}>
                        Public Portfolio
                    </SidebarLink>
                </nav>
                <div className="hidden md:block mt-auto">
                    <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-10 overflow-y-auto">
                {/* Pass state and fetched details to child routes via Outlet context */}
                <Outlet context={{ studentDetails, setStudentDetails }} />
            </main>
        </div>
    );
};

export default StudentLayout;

