import React from 'react';

const RoadmapNode = ({ topic, isCompleted }) => {
    return (
        <div className="roadmap-item flex items-center w-full opacity-0">
            {/* The connecting line */}
            <div className="hidden md:flex flex-col items-center mr-4">
                <div className={`w-4 h-4 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                <div className="w-0.5 h-full bg-gray-600"></div>
            </div>

            {/* The content card */}
            <div className={`flex-1 p-4 rounded-lg border-l-4 md:border-l-0 md:border-2 ${isCompleted ? 'border-green-500 bg-gray-800' : 'border-gray-600 bg-gray-800/50'}`}>
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-white">{topic}</p>
                    {isCompleted && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                            ✓
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoadmapNode;
