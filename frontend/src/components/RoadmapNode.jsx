import React from 'react';

const RoadmapNode = ({ topic, isCompleted, isKnown, onComplete }) => {
    const isDone = isCompleted || isKnown;

    return (
        <div className="roadmap-item flex items-center w-full opacity-0">
            {/* The connecting line */}
            <div className="hidden md:flex flex-col items-center mr-4">
                <div className={`w-4 h-4 rounded-full transition-colors ${isDone ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                <div className="w-0.5 h-full bg-gray-600"></div>
            </div>

            {/* The content card */}
            <div className={`flex-1 p-4 rounded-lg border-l-4 md:border-l-0 md:border-2 transition-colors ${isDone ? 'border-green-500 bg-gray-800' : 'border-gray-600 bg-gray-800/50'}`}>
                <div className="flex justify-between items-center">
                    <p className={`font-semibold ${isDone ? 'text-white' : 'text-gray-300'}`}>{topic}</p>
                    
                    {isKnown && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs" title="Already in your skillset!">
                            ✓
                        </div>
                    )}
                    
                    {isCompleted && !isKnown && (
                         <div className="w-6 h-6 bg-green-500/50 rounded-full flex items-center justify-center text-white text-xs" title="Marked as complete!">
                            ✓
                        </div>
                    )}

                    {!isDone && (
                        <button 
                            onClick={() => onComplete(topic)} 
                            className="text-xs bg-gray-700 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md transition"
                            title="Mark this topic as complete"
                        >
                            Complete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoadmapNode;

