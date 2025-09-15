import React from 'react';

const PathwayStep = ({ item, type, icon, color }) => {
    return (
        <div className="pathway-item bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4 opacity-0">
            <div className={`text-xl bg-${color}-500/10 p-2 rounded-lg self-start`}>{icon}</div>
            <div className="flex-1">
                <span className={`text-xs font-bold text-${color}-400`}>{type.toUpperCase()}</span>
                <h4 className="font-bold text-white mt-1">{item.title}</h4>
                <p className="text-sm text-gray-300 leading-relaxed mt-2">{item.description}</p>
                {item.link && (
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm font-semibold text-${color}-400 hover:text-${color}-300 transition-colors mt-3 inline-block`}
                    >
                        View Resource &rarr;
                    </a>
                )}
            </div>
        </div>
    );
};

export default PathwayStep;
