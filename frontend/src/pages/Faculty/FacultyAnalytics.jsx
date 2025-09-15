import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebaseconfig';
import { collection, getDocs } from 'firebase/firestore';
import Spinner from '../../components/Spinner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const FacultyAnalytics = () => {
    const { facultyDetails } = useOutletContext();
    const [chartData, setChartData] = useState({ engagement: [], performance: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // For this dashboard, we fetch all achievements to aggregate data.
                // In a larger app, this would be done on a backend for performance.
                const querySnapshot = await getDocs(collection(db, "achievements"));
                const achievements = querySnapshot.docs.map(doc => doc.data());

                // Process data for Engagement Trends (achievements per month)
                const engagementData = achievements.reduce((acc, ach) => {
                    const month = new Date(ach.submittedAt.toDate()).toLocaleString('default', { month: 'short', year: '2-digit' });
                    if (!acc[month]) {
                        acc[month] = { name: month, submissions: 0 };
                    }
                    acc[month].submissions++;
                    return acc;
                }, {});

                const sortedEngagement = Object.values(engagementData).sort((a, b) => new Date(a.name) - new Date(b.name));

                // Process data for Department Performance
                const performanceData = achievements.reduce((acc, ach) => {
                    const dept = ach.department;
                    if (!acc[dept]) {
                        acc[dept] = { name: dept, achievements: 0 };
                    }
                    acc[dept].achievements++;
                    return acc;
                }, {});

                setChartData({
                    engagement: sortedEngagement,
                    performance: Object.values(performanceData)
                });

            } catch (error) {
                console.error("Error fetching analytics data:", error);
                toast.error("Could not load analytics data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    
    useEffect(() => {
        // Entrance animation
        window.anime({
            targets: '.analytics-card',
            translateY: [-20, 0],
            opacity: [0, 1],
            duration: 800,
            delay: window.anime.stagger(100),
            easing: 'easeOutExpo'
        });
    }, [chartData]);

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">Institutional Analytics</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Engagement Trends Chart */}
                <div className="analytics-card bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                    <h2 className="text-xl font-semibold text-white mb-4">Engagement Trends</h2>
                    <p className="text-sm text-gray-400 mb-6">Total achievements submitted per month.</p>
                    <div className="w-full h-72">
                        <ResponsiveContainer>
                            <LineChart data={chartData.engagement}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} />
                                <Legend />
                                <Line type="monotone" dataKey="submissions" stroke="#22D3EE" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Department Performance Chart */}
                <div className="analytics-card bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700 opacity-0">
                    <h2 className="text-xl font-semibold text-white mb-4">Department Performance</h2>
                    <p className="text-sm text-gray-400 mb-6">Total verified achievements per department.</p>
                     <div className="w-full h-72">
                        <ResponsiveContainer>
                             <BarChart data={chartData.performance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} />
                                <Legend />
                                <Bar dataKey="achievements" fill="#818CF8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyAnalytics;
